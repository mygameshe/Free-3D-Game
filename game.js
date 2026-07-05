let bike = document.getElementById("bike");
let x = window.innerWidth / 2;

// Keyboard Controls (PC)
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") {
    x -= 20;
  }

  if (e.key === "ArrowRight") {
    x += 20;
  }

  bike.style.left = x + "px";
});
