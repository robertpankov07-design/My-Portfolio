const header = document.querySelector("[data-header]");
const progressBar = document.querySelector("[data-progress]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const year = document.querySelector("[data-year]");
const backToTop = document.querySelector("[data-back-to-top]");

if (year) year.textContent = new Date().getFullYear();

const syncPageState = () => {
  const scrollTop = window.scrollY;
  const height = document.documentElement.scrollHeight - window.innerHeight;
  header?.classList.toggle("is-scrolled", scrollTop > 12);
  backToTop?.classList.toggle("visible", scrollTop > 520);
  if (progressBar) progressBar.style.width = `${height > 0 ? (scrollTop / height) * 100 : 0}%`;
};

syncPageState();
window.addEventListener("scroll", syncPageState, { passive: true });

menuToggle?.addEventListener("click", () => {
  document.body.classList.toggle("menu-open");
  menuToggle.setAttribute("aria-expanded", String(document.body.classList.contains("menu-open")));
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  const current = location.pathname.split("/").pop() || "portfolio.html";
  if (link.getAttribute("href") === current) link.classList.add("active");
  link.addEventListener("click", () => document.body.classList.remove("menu-open"));
});

backToTop?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((element) => observer.observe(element));


document.querySelectorAll("[data-copy]").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy || "";
    try {
      await navigator.clipboard.writeText(value);
      const oldText = button.textContent;
      button.textContent = "Скопировано";
      setTimeout(() => (button.textContent = oldText), 1400);
    } catch {
      alert(value);
    }
  });
});

const contactForm = document.querySelector("[data-contact-form]");
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formMessage = contactForm.querySelector("[data-form-message]");
  const name = contactForm.elements.name.value.trim();
  const email = contactForm.elements.email.value.trim();
  const message = contactForm.elements.message.value.trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !emailOk || message.length < 10) {
    formMessage.textContent = "Заполните имя, корректную почту и сообщение от 10 символов.";
    formMessage.className = "form-message error";
    return;
  }

  const subject = encodeURIComponent(`Сообщение с портфолио от ${name}`);
  const body = encodeURIComponent(`${message}\n\nПочта для ответа: ${email}`);
  formMessage.textContent = "Форма проверена. Открою почтовый клиент для отправки.";
  formMessage.className = "form-message success";
  setTimeout(() => {
    window.location.href = `mailto:student.portfolio@example.com?subject=${subject}&body=${body}`;
  }, 450);
});

const userProjectsKey = "portfolioUserProjects";
const projectsGrid = document.querySelector("[data-projects-grid]");
const projectModal = document.querySelector("[data-project-modal]");
const projectForm = document.querySelector("[data-add-project-form]");
const projectFormMessage = document.querySelector("[data-project-form-message]");

const escapeHtml = (value) => String(value || "").replace(/[&<>"]/g, (char) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[char]));

const getUserProjects = () => {
  try {
    return JSON.parse(localStorage.getItem(userProjectsKey)) || [];
  } catch {
    return [];
  }
};

const saveUserProjects = (projects) => {
  localStorage.setItem(userProjectsKey, JSON.stringify(projects));
};

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve("");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const makeProjectCard = (project) => {
  const image = project.image
    ? `<img src="${project.image}" alt="Превью проекта ${escapeHtml(project.title)}">`
    : `<div class="user-project-placeholder">${escapeHtml(project.title.slice(0, 1).toUpperCase())}</div>`;
  const imageWrap = project.link
    ? `<a class="project-image" href="${escapeHtml(project.link)}" target="_blank" rel="noreferrer">${image}</a>`
    : `<div class="project-image">${image}</div>`;
  const openButton = project.link
    ? `<a class="button button-primary" href="${escapeHtml(project.link)}" target="_blank" rel="noreferrer">Открыть проект</a>`
    : "";

  return `
    <article class="project-card user-project reveal is-visible" data-user-project-id="${project.id}">
      ${imageWrap}
      <div class="project-body">
        <p class="project-meta">${escapeHtml(project.type)}</p>
        <h3>${escapeHtml(project.title)}</h3>
        <p>${escapeHtml(project.description)}</p>
        <div class="project-actions">
          ${openButton}
          <button class="button button-secondary delete-project" type="button" data-delete-project="${project.id}">Удалить</button>
        </div>
      </div>
    </article>
  `;
};

const renderUserProjects = () => {
  if (!projectsGrid) return;
  projectsGrid.querySelectorAll("[data-user-project-id]").forEach((card) => card.remove());
  projectsGrid.insertAdjacentHTML("beforeend", getUserProjects().map(makeProjectCard).join(""));
};

const openProjectModal = () => {
  if (!projectModal) return;
  projectModal.hidden = false;
  document.body.classList.add("menu-open");
  projectForm?.elements.title?.focus();
};

const closeProjectModal = () => {
  if (!projectModal) return;
  projectModal.hidden = true;
  document.body.classList.remove("menu-open");
  projectForm?.reset();
  if (projectFormMessage) {
    projectFormMessage.textContent = "";
    projectFormMessage.className = "form-message full-field";
  }
};

document.querySelector("[data-open-project-form]")?.addEventListener("click", openProjectModal);
document.querySelectorAll("[data-close-project-form]").forEach((button) => {
  button.addEventListener("click", closeProjectModal);
});

projectModal?.addEventListener("click", (event) => {
  if (event.target === projectModal) closeProjectModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && projectModal && !projectModal.hidden) closeProjectModal();
});

projectForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(projectForm);
  const title = formData.get("title").trim();
  const type = formData.get("type").trim();
  const description = formData.get("description").trim();
  const link = formData.get("link").trim();
  const imageFile = projectForm.elements.image.files[0];

  if (!title || !type || description.length < 10) {
    projectFormMessage.textContent = "Заполните название, тип и описание от 10 символов.";
    projectFormMessage.className = "form-message full-field error";
    return;
  }

  const image = await fileToDataUrl(imageFile);
  const projects = getUserProjects();
  projects.push({
    id: String(Date.now()),
    title,
    type,
    description,
    link,
    image
  });
  saveUserProjects(projects);
  renderUserProjects();
  closeProjectModal();
});

projectsGrid?.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-project]");
  if (!deleteButton) return;
  const id = deleteButton.dataset.deleteProject;
  saveUserProjects(getUserProjects().filter((project) => project.id !== id));
  renderUserProjects();
});

renderUserProjects();


