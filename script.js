// =========================================================
// Rock is Dead — site interactivity
// =========================================================

// ---------- SETTINGS: paste your Web3Forms access key here ----------
// Get a free key at https://web3forms.com (enter your email, and the key arrives in your inbox).
// Every registration will then be emailed to that address.
const WEB3FORMS_ACCESS_KEY = '5bed0cf0-f107-4446-bd63-1158b8f39245';


// ---------- 1. Registration form ----------
const form = document.getElementById('registerForm');
const formMsg = document.getElementById('formMsg');
const submitBtn = document.getElementById('submitBtn');

function showMessage(text, type) {
  formMsg.textContent = text;
  formMsg.className = 'form__msg ' + (type === 'success' ? 'is-success' : 'is-error');
}

// Check the required fields and highlight any that are wrong
function validate() {
  let ok = true;
  ['name', 'email'].forEach((id) => {
    const input = document.getElementById(id);
    const valid = input.value.trim() !== '' && input.checkValidity();
    input.closest('.field').classList.toggle('has-error', !valid);
    if (!valid) ok = false;
  });
  return ok;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault(); // stop the browser from reloading the page

  if (!validate()) {
    showMessage('Please add your name and a valid email.', 'error');
    return;
  }

  if (WEB3FORMS_ACCESS_KEY === 'YOUR_ACCESS_KEY_HERE') {
    showMessage('Almost there: the form isn\'t connected yet. Add your Web3Forms key in script.js.', 'error');
    return;
  }

  // Collect everything typed into the form
  const data = Object.fromEntries(new FormData(form));

  // Extra info for the email you receive
  data.access_key = WEB3FORMS_ACCESS_KEY;
  data.subject = `New Rock is Dead registration: ${data.event}`;
  data.from_name = 'Rock is Dead website';
  data.replyto = data.email; // so you can hit "Reply" to answer the guest directly

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending…';

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();

    if (result.success) {
      showMessage(`You're on the list, ${data.name.split(' ')[0]}. Check your inbox before the night. 🤘`, 'success');
      form.reset();
    } else {
      showMessage('Something went wrong. Please try again in a moment.', 'error');
    }
  } catch (error) {
    showMessage('Couldn\'t connect. Check your internet and try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Count me in';
  }
});

// Remove the red error outline as soon as someone starts typing
form.querySelectorAll('input').forEach((input) =>
  input.addEventListener('input', () => input.closest('.field')?.classList.remove('has-error'))
);


// ---------- 2. "Register" buttons on each event pre-select that event ----------
const eventSelect = document.getElementById('event');
document.querySelectorAll('[data-event]').forEach((button) => {
  button.addEventListener('click', () => {
    eventSelect.value = button.dataset.event;
    // Focus the name field after the page finishes scrolling down
    setTimeout(() => document.getElementById('name').focus({ preventScroll: true }), 600);
  });
});


// ---------- 3. Fade sections in as you scroll ----------
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);
document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));


// ---------- 4. Mobile menu ----------
const menuBtn = document.getElementById('menuBtn');
const nav = document.getElementById('nav');

menuBtn.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('is-open');
  menuBtn.setAttribute('aria-expanded', String(isOpen));
});
nav.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    nav.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
  })
);


// ---------- 5. Current year in the footer ----------
document.getElementById('year').textContent = new Date().getFullYear();


// ---------- 6. Hide events that are already over ----------
// An event counts as "over" 12 hours after it starts (so it stays up during the night itself).
const HOURS_AFTER_START = 12;
const now = new Date();
const upcoming = []; // events still to come, used by the countdown below

document.querySelectorAll('.event[data-date]').forEach((item) => {
  const start = new Date(item.dataset.date);
  const over = now - start > HOURS_AFTER_START * 60 * 60 * 1000;

  if (over) {
    item.remove();
    // Also remove it from the "Which event?" dropdown in the form
    const label = item.querySelector('[data-event]')?.dataset.event;
    [...eventSelect.options].forEach((option) => {
      if (option.text === label) option.remove();
    });
  } else {
    upcoming.push({ name: item.dataset.name, start });
  }
});

// If nothing is left, show the "No nights announced" message instead
if (upcoming.length === 0) {
  document.getElementById('eventList').hidden = true;
  document.getElementById('eventsEmpty').hidden = false;
}


// ---------- 7. Countdown to the next event ----------
const nextEvent = upcoming
  .filter((e) => e.start > now)        // only ones that haven't started yet
  .sort((a, b) => a.start - b.start)[0]; // earliest first

if (nextEvent) {
  const countdown = document.getElementById('countdown');
  const pad = (n) => String(n).padStart(2, '0'); // 7 -> "07"

  document.getElementById('countdownName').textContent = nextEvent.name;
  countdown.hidden = false;

  function tick() {
    const msLeft = nextEvent.start - new Date();
    if (msLeft <= 0) {
      countdown.querySelector('.countdown__label').textContent = `${nextEvent.name} is happening now 🤘`;
      countdown.querySelector('.countdown__clock').hidden = true;
      clearInterval(timer);
      return;
    }
    const secs = Math.floor(msLeft / 1000);
    document.getElementById('cdDays').textContent = pad(Math.floor(secs / 86400));
    document.getElementById('cdHours').textContent = pad(Math.floor((secs % 86400) / 3600));
    document.getElementById('cdMins').textContent = pad(Math.floor((secs % 3600) / 60));
    document.getElementById('cdSecs').textContent = pad(secs % 60);
  }

  tick();                               // show the numbers straight away
  const timer = setInterval(tick, 1000); // then update every second
}
