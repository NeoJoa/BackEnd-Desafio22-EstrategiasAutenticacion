import ProductManager from "./ProductsManager.js";
import cartModel from "../models/carts.model.js";

const dbpm = new ProductManager();

export default class CartsManager {
  constructor() {}

  async getCarts() {
    try {
      const carts = await cartModel.find().populate("products.pid");
      return !carts.length
        ? {
            status: 404,
            error: "No se encontraron los carritos",
          }
        : carts;
    } catch (error) {
      return {
        status: 500,
        error: "Ha ocurrido un error mientras se obtenian los carritos",
      };
    }
  }

  async getCartById(id) {
    try {
      const cart = await cartModel.findById(id).lean().populate("products.pid");
      return cart === null
        ? {
            status: 404,
            error: `No se encontro el carrito con el ID: ${id}`,
          }
        : cart.products;
    } catch (error) {
      return {
        status: 500,
        error: `Ha ocurrido un error mientras se obtenia el carrito con el ID: ${id}`,
      };
    }
  }

  async addCart() {
    try {
      return await cartModel.create({ products: [] });
    } catch (error) {
      return {
        status: 500,
        error: "Ha ocurrido un error mientras se creaba el carrito",
      };
    }
  }

  async addProductToCart(cid, pid) {
    try {
      const cartFinded = await this.getCartById(cid);
      if (cartFinded.error)
        return {
          status: 404,
          error: `No se encontro el carrito con el ID: ${cid}`,
        };

      const productFinded = await dbpm.getProductById(pid);
      if (productFinded.error)
        return {
          status: 404,
          error: `No se encontro el producto con el ID: ${pid}`,
        };

      const productInCart = cartFinded.find(
        (product) => product.pid._id == pid
      );
      if (productInCart) {
        const productIndex = cartFinded.findIndex(
          (product) => product.pid._id == pid
        );
        const newCart = cartFinded;
        newCart[productIndex].quantity++;
        return await cartModel.findByIdAndUpdate(cid, { products: newCart });
      }

      return await cartModel.findByIdAndUpdate(cid, {
        $push: { products: { pid, quantity: 1 } },
      });
    } catch (error) {
      return {
        status: 500,
        error: `Ha ocurrido un error mientras se agregaba el producto`,
      };
    }
  }

  async updateProducts(cid, products) {
    try {
      const cartFinded = await this.getCartById(cid);
      if (cartFinded.error) return cartFinded;

      const dbProducts = (await dbpm.getProducts()).payload.map((product) =>
        product._id.toString()
      );

      const productsExist = products.map((product) => {
        const result = dbProducts.find((dbProduct) => dbProduct == product.pid);
        return result ? true : false;
      });

      if (productsExist.includes(false))
        return {
          status: 404,
          error:
            "Hubo un error mientras se trataba de agregar un producto inexistente al carrito",
        };

      await this.removeAllProductsToCart(cid);
      await cartModel.findByIdAndUpdate(cid, { products: products });
      return { status: "success", message: "Carrito actualizado exitosamente" };
    } catch (error) {
      return {
        status: 500,
        error: `Hubo un error mientras se actualizaba el carrito con el ID: ${cid}`,
      };
    }
  }

  async updateQuantity(cid, pid, quantity) {
    try {
      if (typeof quantity !== "number")
        return { status: 400, error: "El monto debe ser un numero" };

      const cartFinded = await this.getCartById(cid);
      if (cartFinded.error) return cartFinded;

      const productFinded = await dbpm.getProductById(pid);
      if (productFinded.error)
        return {
          status: 404,
          error: `No se encontro el producto con el ID: ${pid}`,
        };

      const productInCart = cartFinded.find(
        (product) => product.pid._id == pid
      );
      if (productInCart) {
        const productIndex = cartFinded.findIndex(
          (product) => product.pid._id == pid
        );
        const newCart = [...cartFinded];
        newCart[productIndex].quantity = quantity;

        await cartModel.findByIdAndUpdate(cid, { products: newCart });
        return {
          status: "success",
          message: "La cantidad se actualizo correctamente",
        };
      }
      return {
        status: 404,
        error: `El producto con el ID: ${pid}, no se encontro el el carrito con el ID: ${cid}`,
      };
    } catch (error) {
      return {
        status: 500,
        error: "Ha ocurrido un error al actualizar la cantidad",
      };
    }
  }

  async removeToCart(cid, pid) {
    try {
      const cartFinded = await this.getCartById(cid);
      if (cartFinded.error)
        return {
          status: 404,
          error: `No se encontro el carrito con el ID: ${cid}`,
        };

      const productInCart = cartFinded.find(
        (product) => product.pid._id == pid
      );

      if (productInCart) {
        await cartModel.findByIdAndUpdate(cid, {
          $pull: { products: { pid } },
        });
        return { status: "success", message: "Producto borrado exitosamente" };
      }
      return {
        status: 404,
        error: `El producto con el ID: ${pid}, no se encontro el el carrito con el ID: ${cid}`,
      };
    } catch (error) {
      return {
        status: 500,
        error: `Hubo un error mientras se borraba el producto con el ID: ${pid}`,
      };
    }
  }

  async removeAllProductsToCart(cid) {
    try {
      const cartFinded = await this.getCartById(cid);
      if (cartFinded.error)
        return {
          status: 404,
          error: `No se encontro el carrito con el ID: ${cid}`,
        };

      await cartModel.findByIdAndUpdate(cid, { products: [] });
      return {
        status: "success",
        message: "Todos los productos fueron borrados exitosamente",
      };
    } catch (error) {
      return {
        status: 500,
        error: `Ha ocurrido un error mientras se borraban los productos`,
      };
    }
  }
}
