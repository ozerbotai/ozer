async function showUserEventLogs() {
  try {    
    const email = document.getElementById('email').value;
    const userLogs = await getUserEventLogsByEmail(email);

    const table = document.createElement('table');
    table.setAttribute('border', '1');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    
    const headers = ['created_at', 'email', 'description', 'log_type', 'browserLanguage', 'platform', 'isMobile', 'newMode', 'oldMode'];
    const trHead = document.createElement('tr');
    headers.forEach(header => {
      const th = document.createElement('th');
      th.textContent = header;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    userLogs.forEach(user => {
      const tr = document.createElement('tr');
      const tdCreated_at = document.createElement('td');
      tdCreated_at.textContent = user.created_at ? user.created_at.slice(0,19) : '';
      const tdEmail = document.createElement('td');
      tdEmail.textContent = user.email;
      const tdDescription = document.createElement('td');
      tdDescription.textContent = user.description;
      const tdLogType = document.createElement('td');
      tdLogType.textContent = user.log_type;
      const tdBrowserLanguage = document.createElement('td');
      tdBrowserLanguage.textContent = user.browserLanguage;
      const tdPlatform = document.createElement('td');
      tdPlatform.textContent = user.platform;
      const tdIsMobile = document.createElement('td');
      tdIsMobile.textContent = user.isMobile;
      const tdNewMode = document.createElement('td');
      tdNewMode.textContent = user.newMode;
      const tdOldMode = document.createElement('td');
      tdOldMode.textContent = user.oldMode;
      tr.appendChild(tdCreated_at);
      tr.appendChild(tdEmail);
      tr.appendChild(tdDescription);
      tr.appendChild(tdLogType);
      tr.appendChild(tdBrowserLanguage);
      tr.appendChild(tdPlatform);
      tr.appendChild(tdIsMobile);
      tr.appendChild(tdNewMode);
      tr.appendChild(tdOldMode);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);

    const logsDiv = document.getElementById('logs');
    logsDiv.innerHTML = '';
    logsDiv.appendChild(document.createElement('br'));
    logsDiv.appendChild(document.createElement('br'));
    logsDiv.appendChild(table);
  } catch (err) {
    console.error('Error fetching user logs:', err);
  }
}

showUserEventLogs();
