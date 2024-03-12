SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium" WITH SCHEMA "pgsodium";


COMMENT ON SCHEMA "public" IS 'standard public schema';


CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";


CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


CREATE TYPE "public"."summary_length_enum" AS ENUM (
    'AUTOMATIC',
    'FIXED_SMALL',
    'FIXED_MEDIUM',
    'FIXED_LARGE',
    'PROPORTIONAL_HALF',
    'PROPORTIONAL_QUARTER'
);


ALTER TYPE "public"."summary_length_enum" OWNER TO "postgres";


CREATE TYPE "public"."summary_type_enum" AS ENUM (
    'AUTOMATIC',
    'FIX_SMALL',
    'FIX_MEDIUM',
    'FIX_LARGE',
    'PROPORTIONAL_HALF',
    'PROPORTIONAL_QUARTER',
    'FIXED_SMALL',
    'FIXED_MEDIUM',
    'FIXED_LARGE'
);


ALTER TYPE "public"."summary_type_enum" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_by_phone"("param_user_phone" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$BEGIN
delete from user_languages_contacts where user_phone=param_user_phone;
delete from user_languages_groups where user_phone=param_user_phone;
delete from userexceptions where user_phone=param_user_phone;
delete from userexceptions_groups where user_phone=param_user_phone;
delete from userqr_codes where user_phone=param_user_phone;
delete from transcriptions_log where user_phone=param_user_phone;
delete from userconfig where user_phone=param_user_phone;
DELETE FROM user_event_log WHERE email IN (SELECT user_event_log.email FROM user_event_log JOIN userconfig ON user_event_log.email = userconfig.email WHERE userconfig.user_phone = param_user_phone);
DELETE FROM waitlist_users WHERE email IN (SELECT waitlist_users.email FROM waitlist_users JOIN userconfig ON waitlist_users.email = userconfig.email WHERE userconfig.user_phone = param_user_phone);
DELETE FROM user_connection_event_log WHERE email IN (SELECT user_connection_event_log.email FROM user_connection_event_log JOIN userconfig ON user_connection_event_log.email = userconfig.email WHERE userconfig.user_phone = param_user_phone);
END;$$;


ALTER FUNCTION "public"."delete_user_by_phone"("param_user_phone" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_transcriptions_log"() RETURNS TABLE("user_phone" "text", "alias" "text", "transcribed" integer, "daily_transcribed" double precision, "daily_private" double precision, "daily_respond" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        transcriptions_log.user_phone,
        userconfig.alias,
        COUNT(*)::integer AS transcribed,
        (COUNT(*)::float / 30) AS daily_transcribed,
        (COUNT(CASE WHEN transcriptions_log.private = TRUE THEN 1 END)::float / 30) AS daily_private,
        (COUNT(CASE WHEN transcriptions_log.respond = TRUE THEN 1 END)::float / 30) AS daily_respond
    FROM
        transcriptions_log
    JOIN
        userconfig
    ON
        transcriptions_log.user_phone = userconfig.user_phone
    WHERE
        (transcriptions_log.private = TRUE OR transcriptions_log.respond = TRUE)
        AND transcriptions_log.timestamp > CURRENT_DATE - INTERVAL '30 days'
        AND transcriptions_log.timestamp < CURRENT_DATE
        AND transcriptions_log.group_or_contact = 'CONTACT'
    GROUP BY
        transcriptions_log.user_phone,
        userconfig.alias
    ORDER BY
        transcribed DESC;
END;
$$;


ALTER FUNCTION "public"."get_transcriptions_log"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_transcriptions_log_summaries_30_days"() RETURNS TABLE("user_phone" "text", "alias" "text", "transcribed" integer, "daily_transcribed" double precision, "daily_private" double precision, "daily_respond" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        transcriptions_log.user_phone,
        userconfig.alias,
        COUNT(*)::integer AS transcribed,
        (COUNT(*)::float / 30) AS daily_transcribed,
        (COUNT(CASE WHEN transcriptions_log.private = TRUE THEN 1 END)::float / 30) AS daily_private,
        (COUNT(CASE WHEN transcriptions_log.respond = TRUE THEN 1 END)::float / 30) AS daily_respond
    FROM
        transcriptions_log
    JOIN
        userconfig
    ON
        transcriptions_log.user_phone = userconfig.user_phone
    WHERE
        (transcriptions_log.private = TRUE OR transcriptions_log.respond = TRUE)
        AND transcriptions_log.timestamp > CURRENT_DATE - INTERVAL '30 days'
        AND transcriptions_log.timestamp < CURRENT_DATE
        AND transcriptions_log.group_or_contact = 'CONTACT'
    GROUP BY
        transcriptions_log.user_phone,
        userconfig.alias
    ORDER BY
        transcribed DESC;
END;
$$;


ALTER FUNCTION "public"."get_transcriptions_log_summaries_30_days"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."insert_log_and_lock3"("param_user_phone" "text", "param_is_group" boolean, "param_group_id" "text", "param_contact_phone" "text", "param_file_hash" "text", "param_duration" integer, "param_media_key" "text", "param_size" integer, "param_device_type" "text", "param_sent_or_received" "text", "param_private" boolean, "param_respond" boolean) RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    log_id INT;
    log_id1 INT;
    log_id2 INT;
    result boolean;
    contact_group text;
BEGIN
    LOCK TABLE transcriptions_log IN ACCESS EXCLUSIVE MODE;
    if param_is_group = true then
        select id
        into log_id1
        from transcriptions_log
        where file_hash = param_file_hash
            and respond = true
            and group_id = param_group_id
            and group_or_contact = 'GROUP';
        log_id = log_id1;
        contact_group = 'GROUP';
    else
        select id
        into log_id2
        from transcriptions_log
        where file_hash = param_file_hash
            and respond = true
            and user_phone = param_contact_phone
            and contact_phone = param_user_phone
            and group_or_contact = 'CONTACT';
        log_id = log_id2;
        contact_group = 'CONTACT';
    end if;
    if log_id is null then
        insert into transcriptions_log (user_phone, group_or_contact, group_id, file_hash, duration, media_key, size, device_type, sent_or_received, contact_phone, private, respond) values (param_user_phone, contact_group, param_group_id, param_file_hash, param_duration, param_media_key, param_size, param_device_type, param_sent_or_received, param_contact_phone, param_private, param_respond);
        result = true;
    else 
        result = false;
    end if;
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."insert_log_and_lock3"("param_user_phone" "text", "param_is_group" boolean, "param_group_id" "text", "param_contact_phone" "text", "param_file_hash" "text", "param_duration" integer, "param_media_key" "text", "param_size" integer, "param_device_type" "text", "param_sent_or_received" "text", "param_private" boolean, "param_respond" boolean) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."userconfig" (
    "id" bigint NOT NULL,
    "user_phone" "text" NOT NULL,
    "general_mode" "text" DEFAULT 'PRIVATE'::"text" NOT NULL,
    "alias" "text" NOT NULL,
    "general_mode_groups" "text" DEFAULT 'PRIVATE'::"text" NOT NULL,
    "transcribe_outgoing_messages" boolean NOT NULL,
    "language" "text" DEFAULT 'ES'::"text",
    "comments" "text",
    "assistant_enabled" boolean DEFAULT false,
    "email" "text",
    "login_platform_id" "text",
    "given_name" "text",
    "family_name" "text",
    "nickname" "text",
    "name" "text",
    "picture" "text",
    "is_admin" boolean DEFAULT false,
    "browser_language" "text",
    "transcriptions_paused" boolean DEFAULT false,
    "summarize_messages" boolean NOT NULL,
    "summary_minimum_seconds" integer NOT NULL,
    "summary_use_bullets" boolean NOT NULL,
    "summary_length" "public"."summary_length_enum" NOT NULL,
    "summary_include_full_text" boolean NOT NULL,
    "summary_minimum_words" integer,
    "share_contact_phone_or_group_id" "text",
    "share_contact_phone_or_group_process" boolean
);


ALTER TABLE "public"."userconfig" OWNER TO "postgres";


COMMENT ON TABLE "public"."userconfig" IS 'general_mode can be OFF/PRIVATE/RESPOND';



ALTER TABLE "public"."userconfig" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."config_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."modes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "mode" "text"
);


ALTER TABLE "public"."modes" OWNER TO "postgres";


ALTER TABLE "public"."modes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."modes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."transcriptions_log" (
    "id" bigint NOT NULL,
    "user_phone" "text",
    "group_or_contact" "text",
    "group_id" "text" DEFAULT ''::"text",
    "file_hash" "text",
    "duration" bigint,
    "media_key" "text",
    "size" bigint,
    "device_type" "text",
    "sent_or_received" "text",
    "contact_phone" "text",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "private" boolean,
    "respond" boolean
);


ALTER TABLE "public"."transcriptions_log" OWNER TO "postgres";


ALTER TABLE "public"."transcriptions_log" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."transcriptions_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_connection_event_log" (
    "id" bigint NOT NULL,
    "email" "text",
    "alias" "text",
    "login_platform_id" "text",
    "given_name" "text",
    "family_name" "text",
    "picture" "text",
    "browser_language" "text",
    "platform" "text",
    "is_mobile" boolean,
    "country" "text",
    "region" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_connection_event_log" OWNER TO "postgres";


ALTER TABLE "public"."user_connection_event_log" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_connection_event_log_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_event_log" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "description" "text",
    "log_type" "text",
    "email" "text",
    "newMode" "text",
    "oldMode" "text",
    "browserLanguage" "text",
    "platform" "text",
    "isMobile" boolean,
    "contact_phone_or_group_id" "text"
);


ALTER TABLE "public"."user_event_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_languages_contacts" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_phone" "text",
    "contact_phone" "text",
    "language" "text"
);


ALTER TABLE "public"."user_languages_contacts" OWNER TO "postgres";


ALTER TABLE "public"."user_languages_contacts" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_languages_contacts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."user_languages_groups" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_phone" "text",
    "group_id" "text",
    "language" "text"
);


ALTER TABLE "public"."user_languages_groups" OWNER TO "postgres";


ALTER TABLE "public"."user_languages_groups" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_languages_groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."userqr_codes" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_phone" "text",
    "last_qr_code" "text",
    "state" "text",
    "email" "text"
);


ALTER TABLE "public"."userqr_codes" OWNER TO "postgres";


ALTER TABLE "public"."userqr_codes" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_last_qr_codes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."userconfig_default_values" (
    "id" bigint NOT NULL,
    "general_mode" "text" DEFAULT 'PRIVATE'::"text" NOT NULL,
    "general_mode_groups" "text" DEFAULT 'PRIVATE'::"text" NOT NULL,
    "transcribe_outgoing_messages" boolean NOT NULL,
    "assistant_enabled" boolean DEFAULT false,
    "summarize_messages" boolean NOT NULL,
    "summary_minimum_seconds" integer NOT NULL,
    "summary_use_bullets" boolean NOT NULL,
    "summary_length" "public"."summary_length_enum" NOT NULL,
    "summary_include_full_text" boolean NOT NULL,
    "summary_minimum_words" integer
);


ALTER TABLE "public"."userconfig_default_values" OWNER TO "postgres";


COMMENT ON TABLE "public"."userconfig_default_values" IS 'This is a duplicate of userconfig';



ALTER TABLE "public"."userconfig_default_values" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."userconfig_default_values_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."userexceptions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_phone" "text",
    "contact_phone" "text",
    "mode_for_contact" "text",
    "contact_alias" "text"
);


ALTER TABLE "public"."userexceptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."userexceptions_groups" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_phone" "text",
    "group_id" "text",
    "mode_for_group" "text",
    "group_alias" "text",
    "group_description" "text"
);


ALTER TABLE "public"."userexceptions_groups" OWNER TO "postgres";


ALTER TABLE "public"."userexceptions_groups" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."userexceptions_groups_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."user_event_log" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."userlogs_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."userexceptions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."userwhitelist_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."waitlist_default_values" (
    "id" bigint NOT NULL,
    "waitlist_open" boolean NOT NULL
);


ALTER TABLE "public"."waitlist_default_values" OWNER TO "postgres";


ALTER TABLE "public"."waitlist_default_values" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."waitlist_default_values_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."waitlist_users" (
    "id" bigint NOT NULL,
    "email" "text",
    "alias" "text",
    "login_platform_id" "text",
    "given_name" "text",
    "family_name" "text",
    "picture" "text",
    "browser_language" "text",
    "platform" "text",
    "is_mobile" boolean,
    "country" "text",
    "region" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."waitlist_users" OWNER TO "postgres";


ALTER TABLE "public"."waitlist_users" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."waitlist_users_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."userconfig"
    ADD CONSTRAINT "config_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."modes"
    ADD CONSTRAINT "modes_mode_key" UNIQUE ("mode");



ALTER TABLE ONLY "public"."modes"
    ADD CONSTRAINT "modes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transcriptions_log"
    ADD CONSTRAINT "transcriptions_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_connection_event_log"
    ADD CONSTRAINT "user_connection_event_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_languages_contacts"
    ADD CONSTRAINT "user_languages_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_languages_groups"
    ADD CONSTRAINT "user_languages_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."userqr_codes"
    ADD CONSTRAINT "user_last_qr_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."userconfig_default_values"
    ADD CONSTRAINT "userconfig_default_values_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."userexceptions_groups"
    ADD CONSTRAINT "userexceptions_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_event_log"
    ADD CONSTRAINT "userlogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."userexceptions"
    ADD CONSTRAINT "userwhitelist_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist_default_values"
    ADD CONSTRAINT "waitlist_default_values_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."waitlist_users"
    ADD CONSTRAINT "waitlist_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."userconfig"
    ADD CONSTRAINT "public_userconfig_general_mode_fkey" FOREIGN KEY ("general_mode") REFERENCES "public"."modes"("mode");



ALTER TABLE ONLY "public"."userconfig"
    ADD CONSTRAINT "public_userconfig_general_mode_groups_fkey" FOREIGN KEY ("general_mode_groups") REFERENCES "public"."modes"("mode");



ALTER TABLE ONLY "public"."userexceptions_groups"
    ADD CONSTRAINT "public_userexceptions_groups_mode_for_group_fkey" FOREIGN KEY ("mode_for_group") REFERENCES "public"."modes"("mode");



ALTER TABLE ONLY "public"."userexceptions"
    ADD CONSTRAINT "public_userexceptions_mode_for_contact_fkey" FOREIGN KEY ("mode_for_contact") REFERENCES "public"."modes"("mode");



ALTER TABLE ONLY "public"."userconfig_default_values"
    ADD CONSTRAINT "userconfig_default_values_general_mode_fkey" FOREIGN KEY ("general_mode") REFERENCES "public"."modes"("mode");



ALTER TABLE ONLY "public"."userconfig_default_values"
    ADD CONSTRAINT "userconfig_default_values_general_mode_groups_fkey" FOREIGN KEY ("general_mode_groups") REFERENCES "public"."modes"("mode");





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


GRANT ALL ON FUNCTION "public"."delete_user_by_phone"("param_user_phone" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_by_phone"("param_user_phone" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_by_phone"("param_user_phone" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_transcriptions_log"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_transcriptions_log"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_transcriptions_log"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_transcriptions_log_summaries_30_days"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_transcriptions_log_summaries_30_days"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_transcriptions_log_summaries_30_days"() TO "service_role";



GRANT ALL ON FUNCTION "public"."insert_log_and_lock3"("param_user_phone" "text", "param_is_group" boolean, "param_group_id" "text", "param_contact_phone" "text", "param_file_hash" "text", "param_duration" integer, "param_media_key" "text", "param_size" integer, "param_device_type" "text", "param_sent_or_received" "text", "param_private" boolean, "param_respond" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."insert_log_and_lock3"("param_user_phone" "text", "param_is_group" boolean, "param_group_id" "text", "param_contact_phone" "text", "param_file_hash" "text", "param_duration" integer, "param_media_key" "text", "param_size" integer, "param_device_type" "text", "param_sent_or_received" "text", "param_private" boolean, "param_respond" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_log_and_lock3"("param_user_phone" "text", "param_is_group" boolean, "param_group_id" "text", "param_contact_phone" "text", "param_file_hash" "text", "param_duration" integer, "param_media_key" "text", "param_size" integer, "param_device_type" "text", "param_sent_or_received" "text", "param_private" boolean, "param_respond" boolean) TO "service_role";


















GRANT ALL ON TABLE "public"."userconfig" TO "anon";
GRANT ALL ON TABLE "public"."userconfig" TO "authenticated";
GRANT ALL ON TABLE "public"."userconfig" TO "service_role";



GRANT ALL ON SEQUENCE "public"."config_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."config_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."config_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."modes" TO "anon";
GRANT ALL ON TABLE "public"."modes" TO "authenticated";
GRANT ALL ON TABLE "public"."modes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."modes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."modes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."modes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."transcriptions_log" TO "anon";
GRANT ALL ON TABLE "public"."transcriptions_log" TO "authenticated";
GRANT ALL ON TABLE "public"."transcriptions_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."transcriptions_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."transcriptions_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."transcriptions_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_connection_event_log" TO "anon";
GRANT ALL ON TABLE "public"."user_connection_event_log" TO "authenticated";
GRANT ALL ON TABLE "public"."user_connection_event_log" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_connection_event_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_connection_event_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_connection_event_log_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_event_log" TO "anon";
GRANT ALL ON TABLE "public"."user_event_log" TO "authenticated";
GRANT ALL ON TABLE "public"."user_event_log" TO "service_role";



GRANT ALL ON TABLE "public"."user_languages_contacts" TO "anon";
GRANT ALL ON TABLE "public"."user_languages_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."user_languages_contacts" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_languages_contacts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_languages_contacts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_languages_contacts_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_languages_groups" TO "anon";
GRANT ALL ON TABLE "public"."user_languages_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."user_languages_groups" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_languages_groups_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_languages_groups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_languages_groups_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."userqr_codes" TO "anon";
GRANT ALL ON TABLE "public"."userqr_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."userqr_codes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."user_last_qr_codes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."user_last_qr_codes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."user_last_qr_codes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."userconfig_default_values" TO "anon";
GRANT ALL ON TABLE "public"."userconfig_default_values" TO "authenticated";
GRANT ALL ON TABLE "public"."userconfig_default_values" TO "service_role";



GRANT ALL ON SEQUENCE "public"."userconfig_default_values_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."userconfig_default_values_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."userconfig_default_values_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."userexceptions" TO "anon";
GRANT ALL ON TABLE "public"."userexceptions" TO "authenticated";
GRANT ALL ON TABLE "public"."userexceptions" TO "service_role";



GRANT ALL ON TABLE "public"."userexceptions_groups" TO "anon";
GRANT ALL ON TABLE "public"."userexceptions_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."userexceptions_groups" TO "service_role";



GRANT ALL ON SEQUENCE "public"."userexceptions_groups_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."userexceptions_groups_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."userexceptions_groups_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."userlogs_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."userlogs_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."userlogs_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."userwhitelist_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."userwhitelist_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."userwhitelist_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist_default_values" TO "anon";
GRANT ALL ON TABLE "public"."waitlist_default_values" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist_default_values" TO "service_role";



GRANT ALL ON SEQUENCE "public"."waitlist_default_values_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."waitlist_default_values_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."waitlist_default_values_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist_users" TO "anon";
GRANT ALL ON TABLE "public"."waitlist_users" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist_users" TO "service_role";



GRANT ALL ON SEQUENCE "public"."waitlist_users_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."waitlist_users_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."waitlist_users_id_seq" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";



RESET ALL;



INSERT INTO "public"."modes" ("id", "created_at", "mode") VALUES
	(1, '2024-07-19 23:00:14.336278+00', 'RESPOND'),
	(2, '2024-07-19 23:00:33.462069+00', 'PRIVATE'),
	(3, '2024-07-19 23:00:55.897448+00', 'RESPOND_AND_PRIVATE'),
	(4, '2024-07-19 23:01:12.601463+00', 'OFF');



INSERT INTO "public"."userconfig_default_values" ("id", "general_mode", "general_mode_groups", "transcribe_outgoing_messages", "assistant_enabled", "summarize_messages", "summary_minimum_seconds", "summary_use_bullets", "summary_length", "summary_include_full_text", "summary_minimum_words") VALUES
	(1, 'RESPOND', 'RESPOND', false, false, true, 60, false, 'AUTOMATIC', true, 150);


INSERT INTO "public"."waitlist_default_values" ("id", "waitlist_open") VALUES
	(1, false);


