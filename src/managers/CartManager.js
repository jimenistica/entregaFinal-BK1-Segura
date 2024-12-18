import ErrorManager from "./ErrorManager.js";
import { isValidID } from "../config/mongoose.config.js";
import CartModel from "../models/cart.model.js";

export default class CartManager {
    #cartModel;

    constructor() {
        this.#cartModel = CartModel;
    }

    async #findOneById(id) {
        if (!isValidID(id)) {
            throw new ErrorManager("ID inválido", 400);
        }

        const cart = await this.#cartModel.findById(id).populate("products.product");

        if (!cart) {
            throw new ErrorManager("ID no encontrado", 404);
        }

        return cart;
    }

    async getAll(params) {
        try {
            const paginationOptions = {
                limit: params?.limit || 10,
                page: params?.page || 1,
                populate: "products.product",
                lean: true,
            };

            return await this.#cartModel.paginate({}, paginationOptions);
        } catch (error) {
            throw ErrorManager.handleError(error);
        }
    }

    async getOneById(id) {
        try {
            return await this.#findOneById(id);
        } catch (error) {
            throw ErrorManager.handleError(error);
        }
    }

    async insertOne(data) {
        try {
            const cart = await this.#cartModel.create(data);
            return cart;
        } catch (error) {
            throw ErrorManager.handleError(error);
        }
    }

    async addOneProduct(id, productId) {
        try {
            const cart = await this.#findOneById(id);
            const productIndex = cart.products.findIndex((item) => item.product._id.toString() === productId);

            if (productIndex >= 0) {
                cart.products[productIndex].quantity++;
            } else {
                cart.products.push({ product: productId, quantity: 1 });
            }

            await cart.save();

            return cart;
        } catch (error) {
            throw new ErrorManager(error.message, error.code);
        }
    }

    async deleteOneProduct(id, productId) {
        try {
            const cart = await this.#findOneById(id);
            const productIndex = cart.products.findIndex((item) => item.product._id.toString() === productId);

            if (productIndex < 0) {
                throw new ErrorManager("El producto no existe en el carrito", 404);
            }

            const product= cart.products[productIndex];
            if (product.quantity > 1) {
                cart.products[productIndex].quantity--;
            } else {
                cart.products.splice(productIndex, 1);
            }

            await cart.save();

            return cart;
        } catch (error) {
            throw new ErrorManager(error.message, error.code);
        }
    }

    async deleteOneById(id) {
        try {
            const cart = await this.#findOneById(id);

            if (!cart) {
                throw ErrorManager.handleError(error);
            }

            await this.#cartModel.findByIdAndDelete(id);

            return cart;
        } catch (error) {
            throw ErrorManager.handleError(error);
        }

    }

    async removeAllProductsById(id) {
        try {
            const cart = await this.#findOneById(id);

            if (!cart) {
                throw ErrorManager.handleError(error);
            }

            cart.products = [];
            await cart.save();

            return cart;
        } catch (error) {
            throw ErrorManager.handleError(error);
        }
    }
}