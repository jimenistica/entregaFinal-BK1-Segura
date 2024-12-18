const socket = io();

const errorMessage = document.getElementById("error-message");
const cartDetails = document.getElementById("cart-details");

socket.on("cart-updated", (data) => {

    const cart = data.cart;

    if (!cart || !cart.products.length) {
        cartDetails.innerText = "El carrito está vacío.";
        return;
    }

    cartDetails.innerHTML = `
        <h4>Detalles</h4>
        <h5>Id: ${data.cart._id}</h5>
        <p> Creado: ${data.cart.createdAt}</p>
        <p> Modificado: ${data.cart.updatedAt}</p>
        <ul>
            ${cart.products.map((item) => `
                    <li>
                        ${item.product.title} - Cantidad: ${item.quantity}
                    </li>
                `).join("")}
        </ul>
        <button id="btn-delete-cart" data-cart-id="${cart._id}">Vaciar Carrito</button>

    `;
});

cartDetails.onclick = (event)=>{
    if (event.target && event.target.id === "btn-delete-cart") {
        const cartId = event.target.dataset.cartId;
        socket.emit("delete-cart", { id: cartId });
    }
};

socket.on("error-message", (data) => {
    errorMessage.innerText = data.message;
});