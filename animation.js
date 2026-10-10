
/* Mithuu x Deepak - Floating Hearts Animation */

(() => {
  function startFriendshipAnimation() {
    // Prevent duplicate heart layers
    if (document.querySelector(".friendship-hearts")) return;

    const layer = document.createElement("div");
    layer.className = "friendship-hearts";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    const hearts = ["❤️", "💗", "💕", "💖", "💜", "🫶", "🐼"];

    function createHeart() {
      const heart = document.createElement("span");
      heart.className = "floating-heart";
      heart.textContent =
        hearts[Math.floor(Math.random() * hearts.length)];

      heart.style.left = Math.random() * 100 + "%";
      heart.style.animationDuration = (7 + Math.random() * 6) + "s";
      heart.style.animationDelay = (Math.random() * 2) + "s";
      heart.style.fontSize = (16 + Math.random() * 18) + "px";

      layer.appendChild(heart);

      
heart.addEventListener("animationend", () => {
  heart.remove();
});

setTimeout(() => {
  heart.remove();
}, 15000);
      

    // Start immediately
    for (let i = 0; i < 14; i++) {
      createHeart();
    }

    // Keep creating hearts without growing the DOM forever
    window.setInterval(() => {
      if (layer.childElementCount < 20) {
        createHeart();
      }
    }, 900);

    console.log("Mithuu x Deepak animations started ❤️");
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      startFriendshipAnimation,
      { once: true }
    );
  } else {
    startFriendshipAnimation();
  }
})();

