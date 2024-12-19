const socket = io();

const errorMessage = document.getElementById("error-message");
const cartDetails = document.getElementById("cart-details");
const cartItems = document.getElementById("cart-items");
const btnDeleteCart = document.getElementById("btn-delete-cart");

let cartId;

socket.on("cart-updated", (data) => {
    const cart = data.cart;
    const products= data.cart.products;
    cartId = cart._id;

    if (!cart || !cart.products.length) {
        cartDetails.innerText = "El carrito está vacío.";
        cartItems.innerHTML = "";
        return;
    }

    cartDetails.innerHTML = `
         <h4>Detalles</h4>
         <h5>Id: ${data.cart._id}</h5>
         <p> Creado: ${data.cart.createdAt}</p>
         <p> Modificado: ${data.cart.updatedAt}</p>
    `,

    cartItems.innerHTML = "";
    products.forEach((product) => {
        cartItems.innerHTML += `<tr>
        <td> ${product.product._id} </td>
        <td>  ${product.product.title} </td>
        <td> ${product.quantity} </td>
        <td> $${product.product.price} </td>
        <td>
            <button class="add-to-cart" data-product-id="${product.product._id}">+</button>
            <button class="remove-from-cart" data-product-id="${product.product._id}">-</button>
            <button class="delete-all-from-cart" data-product-id="${product.product._id}">Eliminar Todos</button>
        </td>
        </tr>
        `;
    });
});

btnDeleteCart.onclick = (event)=>{
    if (event.target && event.target.id === "btn-delete-cart") {
        const cartId = event.target.dataset.cartId;
        socket.emit("delete-cart", { id: cartId });
    }
};

document.body.addEventListener("click", (event) => {
    const target = event.target;

    // Botón para agregar productos desde el carrito
    if (target.matches(".add-to-cart")) {
        const productId = target.dataset.productId;
        if (productId) {
            socket.emit("add-product", { productId });
        }
    }

    // Botón para quitar productos desde el carrito
    if (target.matches(".remove-from-cart")) {
        const productId = target.dataset.productId;
        if (productId) {
            socket.emit("remove-product", { productId });
        }
    }

    if (target.matches(".delete-all-from-cart")) {
        const productId = target.dataset.productId;
        console.log(productId);
        console.log(cartId);
        if (productId && cartId) {
            socket.emit("delete-all-products", { cartId, productId });
        }
    }
});

socket.on("error-message", (data) => {
    errorMessage.innerText = data.message;
});