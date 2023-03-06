import fs from "fs";
export default class ProductManager {
  constructor() {
    this.path = "src/dao/fileManager/productBase.json";
  }

  async getProducts(limit) {
    try {
      const document = await fs.promises.readFile(this.path);
      const json = JSON.parse(document);
      if (limit) {
        if (limit <= json.length) json.length = limit;
        return json;
      } else {
        return json;
      }
    } catch (error) {
      return {
        status: 500,
        error:
          "Ha ocurrido un error al momento de leer el archivo, este error proviene del servidor y estamos trabajando para arreglarlo.",
      };
    }
  }

  async addProduct(product) {
    const {
      title,
      description,
      code,
      price,
      status,
      stock,
      category,
      thumbnails,
    } = product;
    if (
      title &&
      description &&
      price &&
      thumbnails &&
      code &&
      stock &&
      status &&
      category
    ) {
      const json = await this.getProducts();
      if (!json.error) {
        let id = json.length + 1;
        const product = {
          title,
          description,
          price,
          category,
          thumbnails,
          status,
          code,
          stock,
          id,
        };
        if (json.find((prod) => prod.id === product.id)) product.id++;
        const exist = json.find(
          (prod) => prod.id === product.id || prod.code === product.code
        );
        if (!exist) {
          json.push(product);
          await this.writeFile(json);
          return { status: "Ok", message: "Producto agregado exitosamente" };
        } else {
          return {
            status: 400,
            error: "Ya existe un producto con estos parametros",
          };
        }
      } else {
        return json;
      }
    } else {
      return { status: 400, error: "Faltan valores pedidos" };
    }
  }

  async getProductById(id) {
    const json = await this.getProducts();
    if (!json.error) {
      const product = json.find((prod) => prod.id === id);
      if (product) {
        return product;
      } else {
        return {
          status: 404,
          error: "No se encontro el producto con este ID",
        };
      }
    } else {
      return json;
    }
  }

  async updateProduct(id, object) {
    const json = await this.getProducts();
    if (!json.error) {
      if (id && object) {
        if (!object.id) {
          const product = json.find((product) => product.id === id);
          if (product) {
            const productIndex = json.findIndex((product) => product.id === id);
            const newProduct = { ...product, ...object };
            json.splice(productIndex, 1, newProduct);
            await this.writeFile(json);
            return {
              status: "Ok",
              message: "Producto actualizado exitosamente",
            };
          } else {
            return {
              status: 400,
              error: "No es posible cambiar el ID de este producto",
            };
          }
        } else {
          return { status: 400, error: "Faltan valores pedidos" };
        }
      } else {
        return {
          status: "404",
          error: "No se encontro el producto con este ID",
        };
      }
    } else {
      return json;
    }
  }

  async deleteProduct(id) {
    if (id) {
      const json = await this.getProducts();
      if (!json.error) {
        const product = json.find((product) => product.id === id);
        if (product) {
          const productIndex = json.findIndex((product) => product.id === id);
          json.splice(productIndex, 1);
          await this.writeFile(json);
          return { status: "Ok", message: "Producto borrado exitosamente" };
        } else {
          return {
            status: 404,
            error: "No se encontro el producto con este ID",
          };
        }
      } else {
        return json;
      }
    } else {
      return { status: 400, error: "Faltan valores pedidos" };
    }
  }

  async writeFile(data) {
    try {
      await fs.promises.writeFile(this.path, JSON.stringify(data));
      return { status: "Ok", message: "Agregado exitosamente" };
    } catch (error) {
      return {
        status: 500,
        error:
          "Ha ocurrido un error al momento de escribir el archivo, este error proviene del servidor y estamos trabajando para arreglarlo.",
      };
    }
  }
}
