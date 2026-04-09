const modeInputs = document.querySelectorAll('input[name="mode"]');
const panelsByMode = {
  server: document.getElementById('serverPanel'),
  monitor: document.getElementById('monitorPanel'),
  sucker: document.getElementById('suckerPanel'),
  script: document.getElementById('scriptPanel'),
  config: document.getElementById('configPanel')
};

const directoryInput = document.getElementById('directory');
const pickDirectoryButton = document.getElementById('pickDirectory');
const portInput = document.getElementById('port');
const passwordInput = document.getElementById('password');
const tunnelInput = document.getElementById('tunnel');

const monitorPortInput = document.getElementById('monitorPort');
const monitorPasswordInput = document.getElementById('monitorPassword');

const suckerUrlInput = document.getElementById('suckerUrl');
const suckerFolderInput = document.getElementById('suckerFolder');

const scriptPathInput = document.getElementById('scriptPath');
const scriptCommandSelect = document.getElementById('scriptCommand');
const pickScriptButton = document.getElementById('pickScript');

const configPathInput = document.getElementById('configPath');
const pickConfigButton = document.getElementById('pickConfig');

const startButton = document.getElementById('startBtn');
const stopButton = document.getElementById('stopBtn');
const status = document.getElementById('status');
const logs = document.getElementById('logs');

function appendLog(message) {
  logs.textContent += `${message}`;
  if (!message.endsWith('\n')) {
    logs.textContent += '\n';
  }
  logs.scrollTop = logs.scrollHeight;
}

function getMode() {
  return Array.from(modeInputs).find((input) => input.checked)?.value || 'server';
}

function setModeUi(mode) {
  Object.entries(panelsByMode).forEach(([panelMode, panel]) => {
    panel.classList.toggle('hidden', panelMode !== mode);
  });
}

function setRunning(running) {
  startButton.disabled = running;
  stopButton.disabled = !running;
  modeInputs.forEach((input) => {
    input.disabled = running;
  });

  status.textContent = running ? 'Running' : 'Idle';
  status.classList.toggle('running', running);
  status.classList.toggle('idle', !running);
}

function validateConfig(mode) {
  if (mode === 'monitor') {
    const port = Number.parseInt(monitorPortInput.value, 10);
    const password = monitorPasswordInput.value.trim();

    if (!port || port < 1 || port > 65535) {
      return { ok: false, error: 'Please provide a valid monitor port (1-65535).' };
    }

    if (!password) {
      return { ok: false, error: 'Monitor mode requires a password.' };
    }

    return {
      ok: true,
      config: {
        mode,
        port,
        password
      }
    };
  }

  if (mode === 'sucker') {
    const url = suckerUrlInput.value.trim();
    const folder = suckerFolderInput.value.trim();

    if (!url) {
      return { ok: false, error: 'Please provide a website URL to mirror.' };
    }

    if (!folder) {
      return { ok: false, error: 'Please provide an output folder name.' };
    }

    return {
      ok: true,
      config: {
        mode,
        url,
        folder
      }
    };
  }

  if (mode === 'script') {
    const script = scriptPathInput.value.trim();
    const command = scriptCommandSelect.value;

    if (!script) {
      return { ok: false, error: 'Please choose a JavaScript file to execute.' };
    }

    return {
      ok: true,
      config: {
        mode,
        command,
        script
      }
    };
  }

  if (mode === 'config') {
    const configPath = configPathInput.value.trim();
    if (!configPath) {
      return { ok: false, error: 'Please choose a config file.' };
    }

    return {
      ok: true,
      config: {
        mode,
        configPath
      }
    };
  }

  const directory = directoryInput.value.trim();
  const port = Number.parseInt(portInput.value, 10);

  if (!directory) {
    return { ok: false, error: 'Please choose a directory to serve.' };
  }

  if (!port || port < 1 || port > 65535) {
    return { ok: false, error: 'Please provide a valid server port (1-65535).' };
  }

  return {
    ok: true,
    config: {
      mode,
      directory,
      port,
      password: passwordInput.value.trim(),
      tunnel: tunnelInput.checked
    }
  };
}

modeInputs.forEach((input) => {
  input.addEventListener('change', () => {
    setModeUi(getMode());
  });
});

pickDirectoryButton.addEventListener('click', async () => {
  const dir = await window.lollipopApi.pickDirectory();
  if (dir) {
    directoryInput.value = dir;
  }
});

pickScriptButton.addEventListener('click', async () => {
  const scriptPath = await window.lollipopApi.pickFile();
  if (scriptPath) {
    scriptPathInput.value = scriptPath;
  }
});

pickConfigButton.addEventListener('click', async () => {
  const configPath = await window.lollipopApi.pickFile();
  if (configPath) {
    configPathInput.value = configPath;
  }
});

startButton.addEventListener('click', async () => {
  const mode = getMode();
  const parsed = validateConfig(mode);

  if (!parsed.ok) {
    appendLog(`[ERROR] ${parsed.error}`);
    return;
  }

  const response = await window.lollipopApi.start(parsed.config);
  if (!response.ok) {
    appendLog(`[ERROR] ${response.message}`);
    return;
  }

  setRunning(true);
});

stopButton.addEventListener('click', async () => {
  const response = await window.lollipopApi.stop();
  if (!response.ok) {
    appendLog(`[ERROR] ${response.message}`);
  }
});

window.lollipopApi.onLog((message) => {
  appendLog(message);
});

window.lollipopApi.onStatus(({ running }) => {
  setRunning(running);
});

setModeUi(getMode());
setRunning(false);
appendLog('Lollipop controller ready. Choose a mode to start any supported Lollipop capability.');
