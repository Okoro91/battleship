const loadContact = () => {
  const content = document.getElementById("content");

  content.innerHTML = "<h1>Welcome to my webpack template</h1>";

  const header = document.createElement("h1");
  header.textContent = "this is the Contact page";
  content.appendChild(header);
};
export default loadContact;
