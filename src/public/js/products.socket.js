const socket = io();

const productsList = document.getElementById("products-list");
const productsForm = document.getElementById("products-form");
const inputProductId = document.getElementById("input-product-id");
const btnDeleteProduct = document.getElementById("btn-delete-product");
const errorMessage = document.getElementById("error-message");
const cartDetails = document.getElementById("cart-details");

document.body.addEventListener("click", (event) => {
    const target = event.target;

    if (target.matches(".add-to-cart")) {
        const productId = target.dataset.productId;
        if (productId) {
            socket.emit("add-product", { productId });
        }
    }

    if (target.matches(".remove-from-cart")) {
        const productId = target.dataset.productId;
        if (productId) {
            socket.emit("remove-product", { productId });
        }
    }
});
let currentPage = 1;
let currentSort = "asc";

socket.on("products-list", (data) => {
    const { docs: products, totalPages=1 } = data || {};
    productsList.innerText = "";

    if (!Array.isArray(products)) {
        console.error("Los productos no están en un arreglo.");
        return;
    }

    products.forEach((product) => {
        productsList.innerHTML += `<tr>
        <td> ${product.id} </td>
        <td>  ${product.title} </td>
        <td> $${product.price} </td>
        <td>
        <button onclick="window.location.href='/product/${product.id}'">Info</button>
        <button class="add-to-cart" data-product-id="${product.id}">+</button>
        <button class="remove-from-cart" data-product-id="${product.id}">-</button>
        </td>
        </tr>
        `;
    });
    const paginationInfo = document.getElementById("pagination-info");
    paginationInfo.dataset.totalPages = totalPages; // Actualiza totalPages dinámicamente
    paginationInfo.innerText = `Página ${currentPage} de ${totalPages}`;
    // document.getElementById("pagination-info").innerText = `Página ${currentPage} de ${totalPages}`;

});

document.getElementById("prev-page").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        socket.emit("change-page", { page: currentPage, sort: currentSort });
    }
});

document.getElementById("next-page").addEventListener("click", () => {
    const totalPages = parseInt(document.getElementById("pagination-info").dataset.totalPages, 10);
    if (currentPage < totalPages) {
        currentPage++;
        socket.emit("change-page", { page: currentPage, sort: currentSort });
    }
});

document.getElementById("tilte-asc").addEventListener("click", () => {
    currentSort = "asc";
    currentPage = 1;
    socket.emit("change-page", { page: currentPage, sort: currentSort });
});

document.getElementById("tilte-desc").addEventListener("click", () => {
    currentSort = "desc";
    currentPage = 1;
    socket.emit("change-page", { page: currentPage, sort: currentSort });
});

productsForm.onsubmit = (event) => {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    errorMessage.innerText = "";

    form.reset();

    socket.emit("insert-product", {
        title: formData.get("title"),
        status: formData.get("status") || "off",
        stock: formData.get("stock"),
        category: formData.get("category"),
        price: formData.get("price"),
        code: formData.get("code"),
        description: formData.get("description"),
    });
};

btnDeleteProduct.onclick = () => {

    const id = inputProductId.value;
    inputProductId.value = "";
    errorMessage.innerText = "";

    socket.emit("delete-product", { id });

};

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