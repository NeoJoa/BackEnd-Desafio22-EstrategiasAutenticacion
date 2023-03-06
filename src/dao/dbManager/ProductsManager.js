import productModel from "../models/products.model.js";
export default class ProductManager {
  constructor() {}

  async getProducts(query, limit = 10, page = 1, sort) {
    try {
      if (query) query = JSON.parse(query);
      const result = await productModel.paginate(query, {
        limit: limit,
        page: page,
        sort: { price: sort },
        lean: true,
      });
      if (result.hasNextPage)
        result.nextLink = `http://localhost:8080/api/products/?${
          query ? "query=" + query + "&" : ""
        }${"limit=" + limit}${"&page=" + (+page + 1)}${
          sort ? "&sort=" + sort : ""
        }`;
      if (result.hasPrevPage)
        result.prevLink = `http://localhost:8080/api/products/?${
          query ? "query=" + query + "&" : ""
        }${"limit=" + limit}${"&page=" + (+page - 1)}${
          sort ? "&sort=" + sort : ""
        }`;
      return {
        status: "success",
        payload: result.docs,
        totalDocs: result.totalDocs,
        limit: result.limit,
        totalPages: result.totalPages,
        page: result.page,
        pagingCounter: result.pagingCounter,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
        prevLink: result.prevLink,
        nextLink: result.nextLink,
      };
    } catch (error) {
      return {
        status: 500,
        error:
          "Ha ocurrido un error al momento de leer la base de datos, este error proviene del servidor y estamos trabajando para arreglarlo.",
      };
    }
  }

  async addProduct(product) {
    try {
      return await productModel.create(product);
    } catch (error) {
      return {
        status: 500,
        error: "Ha ocurrido un error mientras se creaba el producto",
      };
    }
  }

  async getProductById(id) {
    try {
      const product = await productModel.findById(id);
      return product === null
        ? {
            status: 404,
            error: `No se encontro el producto con el ID: ${id}`,
          }
        : product;
    } catch (error) {
      return {
        status: 500,
        error: `Ha ocurrido un error mientras se obtenia el producto con el ID: ${id}`,
      };
    }
  }

  async updateProduct(id, object) {
    try {
      const productUpdated = await productModel.findByIdAndUpdate(id, object, {
        new: true,
      });
      return productUpdated === null
        ? {
            status: 404,
            error: `No se encontro el producto con el ID: ${id}`,
          }
        : productUpdated;
    } catch (error) {
      return {
        status: 500,
        error: `Ha ocurrido un error mientras se actualizaba el producto con el ID: ${id}`,
      };
    }
  }

  async deleteProduct(id) {
    try {
      const productDeleted = await productModel.findByIdAndDelete(id);
      return productDeleted === null
        ? {
            status: 404,
            error: `No se encontro el producto con el ID: ${id}`,
          }
        : {
            status: 200,
            message: `El producto con el ID: ${id}, fue borrado exitosamente`,
          };
    } catch (error) {
      return {
        status: 500,
        error: `Ha ocurrido un error mientras se actualizaba el producto con el ID: ${id}`,
      };
    }
  }
}
