const fs = require('fs')

class ProductManager {
    constructor(dataFile) {
        this.path = dataFile;
    }

    // Agregar un nuevo producto
    addProduct(product) {
        let products = this.loadProductsFromDataFile();
        const newId = this.generateId(products);

        product.id = newId;
        products.push(product);

        this.saveProductsToDataFile(products);

        return newId;
    }

    // Consultar todos los productos
    getProducts() {
        return this.loadProductsFromDataFile();
    }

    // Consultar un producto por su ID
    getProductById(id) {
        const products = this.loadProductsFromDataFile();
        const product = products.find(product => product.id === id);
        return product || null;
    }

    // Actualizar un producto por su ID
    updateProduct(id, updatedProduct) {
        let products = this.loadProductsFromDataFile();
        const index = products.findIndex(product => product.id === id);

        if (index !== -1) {
            // Mantenemos el ID existente y actualizamos el resto de los campos
            products[index] = { ...products[index], ...updatedProduct };
            this.saveProductsToDataFile(products);
            return true;
        }

        return false;
    }

    // Eliminar un producto por su ID
    deleteProduct(id) {
        let products = this.loadProductsFromDataFile();
        const index = products.findIndex(product => product.id === id);

        if (index !== -1) {
            products.splice(index, 1);
            this.saveProductsToDataFile(products);
            return true;
        }

        return false;
    }

    // Cargar productos desde un archivo JSON
    loadProductsFromDataFile() {
        try {
            const data = fs.readFileSync(this.path, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return [];
        }
    }

    // Guardar productos en el archivo JSON
    saveProductsToDataFile(products) {
        const data = JSON.stringify(products, null, 2);
        fs.writeFileSync(this.path, data, 'utf8');
    }

    // Generar un nuevo ID automáticamente
    generateId(products) {
        const maxId = products.reduce((max, product) => (product.id > max ? product.id : max), 0);
        return maxId + 1;
    }
}

// Ejemplo de uso -------------------------------------------------------------------------------------------------------
const productManager = new ProductManager('productos.json');


    
module.exports = ProductManager;
