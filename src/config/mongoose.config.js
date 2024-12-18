import { connect, Types } from "mongoose";

export const connectDB = async () => {
    const URL = "mongodb+srv://Jimena:1234@cluster0.2e2x9.mongodb.net/storePrueba";

    try {
        await connect(URL);
        console.log("Conectado a MongoDB");
    } catch (error) {
        console.log("Error al conectar con MongoDB", error.message);
    }
};

export const isValidID = (id) => {
    return Types.ObjectId.isValid(id);
};