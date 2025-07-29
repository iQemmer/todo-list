let tasks = [];
let coins = 100;
let timer = null;
let timerInterval = null;
let isPaused = false;
let notificationTimeout = null;

function init() {
  const DOM = {
    taskInput: document.getElementById("task-input"),
    addTaskBtn: document.getElementById("add-task-btn"),
    tasksList: document.getElementById("tasks-list"),
    coinsCount: document.getElementById("coins-count"),
    timeCards: document.querySelectorAll(".time-card:not(.custom)"),
    customMinutes: document.getElementById("custom-minutes"),
    customCoins: document.getElementById("custom-coins"),
    startCustomTimer: document.getElementById("start-custom-timer"),
    timerModal: document.getElementById("timer-modal"),
    timerValue: document.getElementById("timer-value"),
    pauseTimer: document.getElementById("pause-timer"),
    cancelTimer: document.getElementById("cancel-timer"),
    closeTimer: document.getElementById("close-timer"),
    notification: document.getElementById("notification"),
    notificationMessage: document.getElementById("notification-message"),
  };

  if (DOM.timerModal) {
    DOM.timerModal.style.display = "none";
    DOM.timerModal.classList.add("hidden");
  }

  loadFromLocalStorage();
  renderTasks();
  updateCoinsDisplay();

  DOM.addTaskBtn.addEventListener("click", addTask);
  DOM.taskInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") addTask();
  });

  DOM.timeCards.forEach((card) => {
    card.addEventListener("click", () => startTimer(card));
  });

  DOM.customMinutes.addEventListener("input", updateCustomCoins);
  DOM.startCustomTimer.addEventListener("click", startCustomTimer);

  DOM.pauseTimer.addEventListener("click", togglePauseTimer);
  DOM.cancelTimer.addEventListener("click", cancelTimer);
  DOM.closeTimer.addEventListener("click", hideTimerModal);

  function loadFromLocalStorage() {
    const savedTasks = localStorage.getItem("tasks");
    const savedCoins = localStorage.getItem("coins");

    if (savedTasks) tasks = JSON.parse(savedTasks);
    if (savedCoins) coins = parseInt(savedCoins);
  }

  function saveToLocalStorage() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
    localStorage.setItem("coins", coins.toString());
  }

  function sortTasks() {
    const completedTasks = tasks.filter((task) => task.completed);
    const incompleteTasks = tasks.filter((task) => !task.completed);

    incompleteTasks.sort((a, b) => {
      return a.text.localeCompare(b.text, "ar");
    });

    completedTasks.sort((a, b) => {
      return a.text.localeCompare(b.text, "ar");
    });

    tasks = [...incompleteTasks, ...completedTasks];
  }

  function renderTasks() {
    sortTasks();

    DOM.tasksList.innerHTML = "";

    tasks.forEach((task, index) => {
      const li = document.createElement("li");
      li.className = "task-item";
      li.innerHTML = `
              <span class="task-text ${task.completed ? "completed" : ""}">${
        task.text
      }</span>
              <div class="task-actions">
                  <button onclick="toggleTaskCompletion(${index})"><i class="fas ${
        task.completed ? "fa-undo" : "fa-check"
      }"></i></button>
                  <button onclick="removeTask(${index})"><i class="fas fa-trash"></i></button>
              </div>
          `;
      DOM.tasksList.appendChild(li);
    });
  }

  function addTask() {
    const taskText = DOM.taskInput.value.trim();
    if (taskText === "") return;

    tasks.push({
      text: taskText,
      completed: false,
    });

    DOM.taskInput.value = "";
    saveToLocalStorage();
    renderTasks();
    showNotification("تمت إضافة المهمة بنجاح", "success");
  }

  function updateCoinsDisplay() {
    DOM.coinsCount.textContent = coins;
  }

  function updateCustomCoins() {
    const minutes = parseInt(DOM.customMinutes.value) || 0;
    const coinsNeeded = minutes;
    DOM.customCoins.textContent = `${coinsNeeded} كوينز`;
  }

  function startCustomTimer() {
    const minutes = parseInt(DOM.customMinutes.value);
    if (!minutes || minutes <= 0) {
      showNotification("الرجاء إدخال وقت صحيح", "warning");
      return;
    }

    startTimer(null, minutes);
  }

  function startTimer(card, customMin, taskText) {
    let minutes;
    let coinsNeeded;

    if (card) {
      minutes = parseInt(card.dataset.minutes);
      coinsNeeded = parseInt(card.dataset.coins);
    } else {
      minutes = customMin;
      coinsNeeded = minutes;
    }

    if (coins < coinsNeeded) {
      if (notificationTimeout) {
        clearTimeout(notificationTimeout);
      }
      DOM.notification.classList.add("hidden");

      setTimeout(() => {
        showNotification(
          `ليس لديك كوينز كافية! تحتاج ${coinsNeeded} كوينز.`,
          "error"
        );
      }, 10);
      return;
    }

    coins -= coinsNeeded;
    updateCoinsDisplay();
    saveToLocalStorage();

    timer = minutes * 60;
    isPaused = false;
    DOM.pauseTimer.innerHTML = '<i class="fas fa-pause"></i> إيقاف مؤقت';
    updateTimerDisplay();

    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      if (!isPaused) {
        timer--;
        updateTimerDisplay();

        if (timer <= 0) {
          clearInterval(timerInterval);
          showNotification(
            `انتهى الوقت${taskText ? ` للمهمة: ${taskText}` : ""}!`,
            "info"
          );
          hideTimerModal();
        }
      }
    }, 1000);

    showTimerModal();
  }

  function updateTimerDisplay() {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    DOM.timerValue.textContent = `${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function togglePauseTimer() {
    isPaused = !isPaused;
    DOM.pauseTimer.innerHTML = isPaused
      ? '<i class="fas fa-play"></i> استمرار'
      : '<i class="fas fa-pause"></i> إيقاف مؤقت';
  }

  function cancelTimer() {
    if (confirm("هل أنت متأكد من إلغاء المؤقت؟")) {
      clearInterval(timerInterval);
      hideTimerModal();
    }
  }

  function showTimerModal() {
    DOM.timerModal.classList.remove("hidden");
    DOM.timerModal.style.display = "flex";
  }

  function hideTimerModal() {
    DOM.timerModal.classList.add("hidden");
    DOM.timerModal.style.display = "none";
    clearInterval(timerInterval);
  }

  function showNotification(message, type = "info") {
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }

    DOM.notification.classList.add("hidden");

    setTimeout(() => {
      DOM.notification.className = "notification " + type;

      let icon = "fa-info-circle";
      if (type === "success") icon = "fa-check-circle";
      if (type === "error") icon = "fa-exclamation-circle";
      if (type === "warning") icon = "fa-exclamation-triangle";

      DOM.notification.innerHTML = `<i class="fas ${icon}"></i><span id="notification-message">${message}</span>`;
      DOM.notification.classList.remove("hidden");

      notificationTimeout = setTimeout(() => {
        DOM.notification.classList.add("hidden");
      }, 4000);
    }, 10);
  }

  window.toggleTaskCompletion = function (index) {
    const wasCompleted = tasks[index].completed;
    tasks[index].completed = !wasCompleted;

    if (!wasCompleted) {
      coins += 5;
      updateCoinsDisplay();
      showNotification("أحسنت! حصلت على 5 كوينز لإكمال المهمة", "success");
    }

    saveToLocalStorage();
    renderTasks();
  };

  window.removeTask = function (index) {
    tasks.splice(index, 1);
    saveToLocalStorage();
    renderTasks();
    showNotification("تم حذف المهمة", "info");
  };
}

document.addEventListener("DOMContentLoaded", init);
