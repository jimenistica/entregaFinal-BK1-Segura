import ErrorManager from "./ErrorManager.js";
import { isValidID } from "../config/mongoose.config.js";
import ProductModel from "../models/product.model.js";
import { convertToBoolean } from "../utils/converter.js";

export default class ProductManager {
    #productModel;

    constructor() {
        this.#productModel = ProductModel;
    }

    async #findOneById(id) {
        if (!isValidID(id)) {
            throw new ErrorManager("ID inválido", 400);
        }

        const product = await this.#productModel.findById(id);

        if (!product) {
            throw new ErrorManager("ID no encontrado", 404);
        }

        return product;
    }

    async getAll(params) {
        try {
            const $and = [];

            if (params?.title) $and.push({ title: { $regex: params.title, $options: "i" } });
            const filters = $and.length > 0 ? { $and } : {};

            const sort = {
                asc: { title: 1 },
                desc: { title: -1 },
            };

            const paginationOptions = {
                limit: params?.limit || 5,
                page: params?.page || 1,
                sort: sort[params?.sort] ?? {},
                lean: true,
            };
            const result = await this.#productModel.paginate(filters, paginationOptions);
            result.docs = result.docs || [];
            return result;
            // return await this.#productModel.find();
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

    async insertOne(data, filename) {
        try {
            const product = await this.#productModel.create({
                ...data,
                status: convertToBoolean(data.status),
                thumbnail: filename ?? null,
            });

            return product;
        } catch (error) {
            throw ErrorManager.handleError(error);
        }
    }

    async updateOneById(id, data) {
        try {
            const product = await this.#findOneById(id);
            const newValues = {
                ...product,
                ...data,
                status: data.status ? convertToBoolean(data.status) : product.status,
            };

            product.set(newValues);
            product.save();

            return product;
        } catch (error) {
            throw ErrorManager.handleError(error);
        }
    }

    async deleteOneById(id) {
        try {
            const product = await this.#findOneById(id);
            await product.deleteOne();
        } catch (error) {
            throw ErrorManager.handleError(error);
        }
    }
}