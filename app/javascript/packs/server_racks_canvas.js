
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById("server-rack-canvas");
    const ctx = canvas.getContext("2d");

    ctx.rect(10,10, 150,100);
    ctx.stroke();
});
