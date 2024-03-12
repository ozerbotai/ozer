async function getUsers() {
  try {    
    const connectedUsers = await getConnectedUsers();
    const disconnectedUsers = await getDisconnectedUsers();
    
    var userConnectedCount = 0;
    var userDisconnectedCount = 0;

    const dateAndTime = document.getElementById('dateAndTime');
    const now = new Date();
    dateAndTime.appendChild(document.createTextNode(now.toLocaleString()));

    const tableConnected = document.createElement('table');
    tableConnected.setAttribute('id', 'connectedUsersTable');
    tableConnected.setAttribute('border', '1');
    const theadConnected = document.createElement('thead');
    const tbodyConnected = document.createElement('tbody');

    const headersConnected = ['user_phone', 'email', 'alias', 'comments', 'general_mode', 'general_mode_groups', 'transcribe_outgoing_messages', 'config', 'logs', 'first_connection', 'exceptions_respond_contact', 'exceptions_respond_group', 'transcribed', 'daily_transcribed', 'daily_private', 'daily_respond'];
    const trHeadConnected = document.createElement('tr');
    headersConnected.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      trHeadConnected.appendChild(th);
    });
    theadConnected.appendChild(trHeadConnected);
    tableConnected.appendChild(theadConnected);

    connectedUsers.forEach(user => {
      const tr = document.createElement('tr');
      const tdPhone = document.createElement('td');
      tdPhone.textContent = user.user_phone;
      const tdEmail = document.createElement('td');
      tdEmail.textContent = user.email;
      const tdName = document.createElement('td');
      tdName.textContent = user.alias;
      const tdComments = document.createElement('td');
      tdComments.textContent = user.comments;
      const tdGeneralMode = document.createElement('td');
      tdGeneralMode.textContent = user.general_mode;
      const tdGeneralModeGroups = document.createElement('td');
      tdGeneralModeGroups.textContent = user.general_mode_groups;
      const tdTranscribeOutgoingMessages = document.createElement('td');
      tdTranscribeOutgoingMessages.textContent = user.transcribe_outgoing_messages;
      const tdConfig = document.createElement('td');
      tdConfig.innerHTML = `<a href="/config/${user.email}" target="_blank">Config</a>`;
      const tdLogs = document.createElement('td');
      tdLogs.innerHTML = `<a href="/users/eventlogs/${user.email}" target="_blank">Logs</a>`;
      const tdConnection = document.createElement('td');
      tdConnection.textContent = user.first_connection ? user.first_connection.slice(0,19) : '';
      const tdExceptionsRespondContact = document.createElement('td');
      tdExceptionsRespondContact.textContent = user.exceptions_respond_contact;
      const tdExceptionsRespondGroup = document.createElement('td');
      tdExceptionsRespondGroup.textContent = user.exceptions_respond_group;
      const tdTranscribed = document.createElement('td');
      tdTranscribed.textContent = user.transcribed;
      const tdDailyTranscribed = document.createElement('td');
      tdDailyTranscribed.textContent = user.daily_transcribed;
      const tdDailyPrivate = document.createElement('td');
      tdDailyPrivate.textContent = user.daily_private;
      const tdDailyRespond = document.createElement('td');
      tdDailyRespond.textContent = user.daily_respond;
      tr.appendChild(tdPhone);
      tr.appendChild(tdEmail);
      tr.appendChild(tdName);
      tr.appendChild(tdComments);
      tr.appendChild(tdGeneralMode);
      tr.appendChild(tdGeneralModeGroups);
      tr.appendChild(tdTranscribeOutgoingMessages);
      tr.appendChild(tdConfig);
      tr.appendChild(tdLogs);
      tr.appendChild(tdConnection);
      tr.appendChild(tdExceptionsRespondContact);
      tr.appendChild(tdExceptionsRespondGroup);
      tr.appendChild(tdTranscribed);
      tr.appendChild(tdDailyTranscribed);
      tr.appendChild(tdDailyPrivate);
      tr.appendChild(tdDailyRespond);
      tbodyConnected.appendChild(tr);
      userConnectedCount++;
    });
    tableConnected.appendChild(tbodyConnected);

    const connectedDiv = document.getElementById('connected');
    connectedDiv.innerHTML = '';
    connectedDiv.appendChild(document.createTextNode(`Number of Connected users: ${userConnectedCount}`));
    connectedDiv.appendChild(document.createElement('br'));
    connectedDiv.appendChild(document.createElement('br'));
    connectedDiv.appendChild(tableConnected);

    $(document).ready(function() {
      // Define a custom parser for the date format 'YYYY-MM-DD HH:MM:SS'
      $.tablesorter.addParser({
        id: 'datetime',
        is: function(s) {
            return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s);
        },
        format: function(s) {
            return s ? new Date(s.replace(' ', 'T')).getTime() : 0;
        },
        type: 'numeric'
      });
    
      // Initializes tablesorter and assigns custom parser to date column
      $('#connectedUsersTable').tablesorter({
        headers: {
            9: { sorter: 'datetime' }
        }
      });
    });

    const tableDisconnected = document.createElement('table');
    tableDisconnected.setAttribute('border', '1');
    const theadDisconnected = document.createElement('thead');
    const tbodyDisconnected = document.createElement('tbody');

    const headersDisconnected = ['user_phone', 'email', 'alias', 'comments', 'general_mode', 'general_mode_groups', 'transcribe_outgoing_messages', 'config', 'logs', 'last_connect', 'last_disconnect'];
    const trHeadDisconnected = document.createElement('tr');
    headersDisconnected.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      trHeadDisconnected.appendChild(th);
    });
    theadDisconnected.appendChild(trHeadDisconnected);
    tableDisconnected.appendChild(theadDisconnected);

    disconnectedUsers.forEach(user => {
      const tr = document.createElement('tr');
      const tdPhone = document.createElement('td');
      tdPhone.textContent = user.user_phone;
      const tdEmail = document.createElement('td');
      tdEmail.textContent = user.email;
      const tdName = document.createElement('td');
      tdName.textContent = user.alias;
      const tdComments = document.createElement('td');
      tdComments.textContent = user.comments;
      const tdGeneralMode = document.createElement('td');
      tdGeneralMode.textContent = user.general_mode;
      const tdGeneralModeGroups = document.createElement('td');
      tdGeneralModeGroups.textContent = user.general_mode_groups;
      const tdTranscribeOutgoingMessages = document.createElement('td');
      tdTranscribeOutgoingMessages.textContent = user.transcribe_outgoing_messages;
      const tdConfig = document.createElement('td');
      tdConfig.innerHTML = `<a href="/config/${user.email}" target="_blank">Config</a>`;
      const tdLogs = document.createElement('td');
      tdLogs.innerHTML = `<a href="/users/eventlogs/${user.email}" target="_blank">Logs</a>`;
      const tdLastConnectWhatsapp = document.createElement('td');
      tdLastConnectWhatsapp.textContent = user.latestConnectDate ? user.latestConnectDate.slice(0,19) : '';
      const tdLastDisconnectWhatsapp = document.createElement('td');
      tdLastDisconnectWhatsapp.textContent = user.latestDiscontectDate ? user.latestDiscontectDate.slice(0,19) : '';
      tr.appendChild(tdPhone);
      tr.appendChild(tdEmail);
      tr.appendChild(tdName);
      tr.appendChild(tdComments);
      tr.appendChild(tdGeneralMode);
      tr.appendChild(tdGeneralModeGroups);
      tr.appendChild(tdTranscribeOutgoingMessages);
      tr.appendChild(tdConfig);
      tr.appendChild(tdLogs);
      tr.appendChild(tdLastConnectWhatsapp);
      tr.appendChild(tdLastDisconnectWhatsapp);
      tbodyDisconnected.appendChild(tr);
      userDisconnectedCount++;
    });
    tableDisconnected.appendChild(tbodyDisconnected);
    
    const disconnectedDiv = document.getElementById('disconnected');
    disconnectedDiv.innerHTML = '';
    disconnectedDiv.appendChild(document.createTextNode(`Number of Disconnected users: ${userDisconnectedCount}`));
    disconnectedDiv.appendChild(document.createElement('br'));
    disconnectedDiv.appendChild(document.createElement('br'));
    disconnectedDiv.appendChild(tableDisconnected);
  } catch (err) {
    console.error('Error fetching connected users:', err);
  }
}

getUsers();
