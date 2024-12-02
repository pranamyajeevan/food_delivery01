const express = require('express');
const bodyParser = require('body-parser');
const cron = require('node-cron');

const app = express();
app.use(bodyParser.json());

// In-memory storage
let menu = [];
let orders = [];
let nextOrderId = 1;

// Predefined categories
const categories = ['Appetizer', 'Main Course', 'Dessert', 'Beverage'];

// API Endpoints

// Add Menu Item
app.post('/menu', (req, res) => {
    const { name, price, category } = req.body;

    // Validate input
    if (!name || price === undefined || !category) {
        return res.status(400).json({ error: 'All fields (name, price, category) are required.' });
    }
    if (price <= 0) {
        return res.status(400).json({ error: 'Price must be a positive number.' });
    }
    if (!categories.includes(category)) {
        return res.status(400).json({ error: `Category must be one of ${categories.join(', ')}.` });
    }

    // Check if item exists and update
    const existingItem = menu.find((item) => item.name === name);
    if (existingItem) {
        existingItem.price = price;
        existingItem.category = category;
    } else {
        menu.push({ id: menu.length + 1, name, price, category });
    }

    res.status(200).json({ message: 'Menu item added/updated successfully.', menu });
});

// Get Menu
app.get('/menu', (req, res) => {
    res.status(200).json(menu);
});

// Place Order
app.post('/orders', (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Order must include a list of item IDs.' });
    }

    // Validate items exist
    const invalidItems = items.filter((id) => !menu.some((item) => item.id === id));
    if (invalidItems.length > 0) {
        return res.status(400).json({ error: `Invalid item IDs: ${invalidItems.join(', ')}` });
    }

    const order = {
        id: nextOrderId++,
        items,
        status: 'Preparing',
        placedAt: new Date(),
    };

    orders.push(order);
    res.status(201).json({ message: 'Order placed successfully.', order });
});

// Get Order by ID
app.get('/orders/:id', (req, res) => {
    const orderId = parseInt(req.params.id, 10);
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
        return res.status(404).json({ error: 'Order not found.' });
    }

    res.status(200).json(order);
});

// CRON Job: Update Order Status
cron.schedule('*/5 * * * *', () => {
    orders.forEach((order) => {
        if (order.status === 'Preparing') {
            order.status = 'Out for Delivery';
        } else if (order.status === 'Out for Delivery') {
            order.status = 'Delivered';
        }
    });

    console.log('Order statuses updated.');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Food Delivery Backend running on http://localhost:${PORT}`);
});
