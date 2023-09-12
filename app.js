const express = require('express');
const fs = require('fs/promises');
const ProductManager = require('./entrega2/productManager');

const app = express();
const port = process.env.PORT || 8080;
const dataFilePath = 'productos.json';
const cartFilePath = 'carrito.json';

const productManager = new ProductManager(dataFilePath);

app.use(express.json());

// Router para productos
const productsRouter = express.Router();

productsRouter.get('/', async (req, res) => {
    try {
        const limit = req.query.limit;
        const products = await productManager.getProducts();

        if (limit) {
            const limitedProducts = products.slice(0, parseInt(limit));
            res.json(limitedProducts);
        } else {
            res.json(products);
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

productsRouter.get('/:pid', async (req, res) => {
    const productId = parseInt(req.params.pid);

    try {
        const product = await productManager.getProductById(productId);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el producto' });
    }
});

productsRouter.post('/', async (req, res) => {
    const newProduct = req.body;

    if (!newProduct || !newProduct.title || !newProduct.description || !newProduct.code || !newProduct.price || !newProduct.stock || !newProduct.category) {
        res.status(400).json({ error: 'Todos los campos son obligatorios' });
        return;
    }

    try {
        const newProductId = productManager.addProduct(newProduct);
        res.status(201).json({ id: newProductId });
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar el producto' });
    }
});

productsRouter.put('/:pid', async (req, res) => {
    const productId = parseInt(req.params.pid);
    const updatedProduct = req.body;

    if (!updatedProduct) {
        res.status(400).json({ error: 'Cuerpo de solicitud vacío' });
        return;
    }

    try {
        const result = productManager.updateProduct(productId, updatedProduct);

        if (result) {
            res.status(200).json({ message: 'Producto actualizado con éxito' });
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
});

productsRouter.delete('/:pid', async (req, res) => {
    const productId = parseInt(req.params.pid);

    try {
        const result = productManager.deleteProduct(productId);

        if (result) {
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Producto no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
});

// Router para carritos
const cartsRouter = express.Router();

cartsRouter.post('/', async (req, res) => {
    try {
        const carts = await loadCartsFromDataFile();
        const newCartId = generateCartId(carts);
        const newCart = { id: newCartId, products: [] };
        carts.push(newCart);
        await saveCartsToDataFile(carts);
        res.status(201).json({ id: newCartId });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el carrito' });
    }
});

cartsRouter.get('/:cid', async (req, res) => {
    const cartId = parseInt(req.params.cid);

    try {
        const carts = await loadCartsFromDataFile();
        const cart = carts.find(cart => cart.id === cartId);

        if (cart) {
            res.json(cart);
        } else {
            res.status(404).json({ error: 'Carrito no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
});

cartsRouter.post('/:cid/product/:pid', async (req, res) => {
    const cartId = parseInt(req.params.cid);
    const productId = parseInt(req.params.pid);
    const quantity = req.body.quantity || 1;

    if (!quantity || isNaN(quantity) || quantity < 1) {
        res.status(400).json({ error: 'Cantidad de producto no válida' });
        return;
    }

    try {
        const carts = await loadCartsFromDataFile();
        const cartIndex = carts.findIndex(cart => cart.id === cartId);

        if (cartIndex !== -1) {
            const cart = carts[cartIndex];
            const productIndex = cart.products.findIndex(product => product.productId === productId);

            if (productIndex !== -1) {
                cart.products[productIndex].quantity += quantity;
            } else {
                cart.products.push({ productId, quantity });
            }

            await saveCartsToDataFile(carts);
            res.status(200).json({ message: 'Producto agregado al carrito' });
        } else {
            res.status(404).json({ error: 'Carrito no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al agregar producto al carrito' });
    }
});

async function loadCartsFromDataFile() {
    try {
        const data = await fs.readFile(cartFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

async function saveCartsToDataFile(carts) {
    const data = JSON.stringify(carts, null, 2);
    await fs.writeFile(cartFilePath, data, 'utf8');
}

function generateCartId(carts) {
    const maxId = carts.reduce((max, cart) => (cart.id > max ? cart.id : max), 0);
    return maxId + 1;
}

app.use('/api/products', productsRouter);
app.use('/api/carts', cartsRouter);

app.listen(port, () => {
    console.log(`Servidor Express escuchando en el puerto ${port}`);
});
