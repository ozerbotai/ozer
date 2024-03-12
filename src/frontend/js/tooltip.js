function updateTooltips() {
  //This function must be called every time a new object with a tooltip is added to the DOM dynamically
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]'
  );
  const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => {
    const tooltipInstance = new bootstrap.Tooltip(tooltipTriggerEl);

    // Add click event to hide the tooltip when the element is clicked
    tooltipTriggerEl.addEventListener('click', () => {
      tooltipInstance.hide();
    });

    return tooltipInstance;
  });
}
