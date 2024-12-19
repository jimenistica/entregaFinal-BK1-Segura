import { Server } from "socket.io";
import ProductManager from "../managers/ProductManager.js";
import CartManager from "../managers/CartManager.js";
import { generateNameForFile } from "../utils/random.js";
import { writeJsonFile } from "../utils/fileHandler.js";
import paths from "../utils/paths.js";

const productManager = new ProductManager();
const cartManager= new CartManager();

export const config = (httpServer) => {
    const socketServer = new Server(httpServer);

    socketServer.on("connection", async (socket) => {
        console.log("Conexión establecida", socket.id);

        let cartId ="6763074e2797b2827b49548a";

        if (!cartId) {
            const newCart = await cartManager.insertOne({ products: [] });
            cartId = newCart._id;
        }

        socket.emit("cart-updated", { cart: await cartManager.getOneById(cartId) });

        const emitPaginatedProducts = async (page = 1, sort = "asc") => {
            const products = await productManager.getAll({ page, sort });
            socketServer.emit("products-list", { ...products, cartId });
        };

        await emitPaginatedProducts();

        socket.on("change-sort", async (data) => {
            const { sort } = data;
            await emitPaginatedProducts(1, sort);
        });

        socket.on("change-page", async (data) => {
            const { page, sort } = data;
            await emitPaginatedProducts(page, sort);
        });

        socket.on("insert-product", async (data) => {
            try {
                if (data.file.name) {
                    const filename = generateNameForFile(data.file.name);
                    await writeJsonFile(paths.images, filename, data.file.buffer);
                    console.log(filename);

                    await productManager.insertOne(data, filename);
                }

                if (!data.file.name) {
                    await productManager.insertOne(data);
                }

                await emitPaginatedProducts();
            } catch (error) {
                socketServer.emit("error-message", { message: error.message });
            }
        });

        socket.on("delete-product", async (data) => {
            try {
                await productManager.deleteOneById(data.id);

                await emitPaginatedProducts();
            } catch (error) {
                socketServer.emit("error-message", { message: error.message });
            }
        });

        socket.on("add-product", async ({ productId }) => {
            try {

                await cartManager.addOneProduct(cartId, productId);

                const updatedCart = await cartManager.getOneById(cartId);

                socket.emit("cart-updated", { cart: updatedCart });

                socket.emit("success-message", { message: "Producto agregado al carrito" });
            } catch (error) {
                socket.emit("error-message", { message: error.message });
            }
        });

        socket.on("remove-product", async ({ productId }) => {
            try {
                if (!cartId) {
                    throw new Error("No tienes un carrito asociado");
                }

                await cartManager.deleteOneProduct(cartId, productId);

                const updatedCart = await cartManager.getOneById(cartId);
                socket.emit("cart-updated", { cart: updatedCart });

                socket.emit("success-message", { message: "Producto eliminado del carrito" });
            } catch (error) {
                socket.emit("error-message", { message: error.message });
            }
        });

        socket.on("delete-all-products", async ({ cartId, productId }) => {
            try {
                const updatedCart = await cartManager.deleteAllProductsByProductId(cartId, productId);
                socket.emit("cart-updated", { cart: updatedCart });
            } catch (error) {
                socket.emit("error-message", { message: error.message });
            }
        });

        socket.on("delete-cart", async (data) => {
            try {
                const cartId = data.id;
                const updatedCart= await cartManager.removeAllProductsById(cartId);

                socket.emit("cart-updated", { cart: updatedCart });
            } catch (error) {
                socketServer.emit("error-message", { message: error.message });
            }
        });

        socket.on("disconnect", () => {
            console.log("Se desconecto un cliente");
        });
    });
};