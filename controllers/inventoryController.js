import Inventory from "../models/Inventory.js";

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private (Manager, Mechanic)
export const getInventory = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ name: 1 });

    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private (Manager, Mechanic)
export const getInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private (Manager)
export const createInventoryItem = async (req, res) => {
  try {
    const {
      name,
      partNumber,
      supplier,
      quantity,
      unit,
      costPrice,
      salePrice,
      lowStockThreshold,
    } = req.body;

    if (!name || !costPrice || !salePrice) {
      return res.status(400).json({
        message: "Please provide name, costPrice, and salePrice",
      });
    }

    const existingItem = await Inventory.findOne({ name });
    if (existingItem) {
      return res.status(400).json({
        message: "Item with this name already exists",
      });
    }

    const item = await Inventory.create({
      name,
      partNumber,
      supplier,
      quantity: quantity || 0,
      unit: unit || "units",
      costPrice,
      salePrice,
      lowStockThreshold: lowStockThreshold || 5,
    });

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      item,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Manager)
export const updateInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const {
      name,
      partNumber,
      supplier,
      quantity,
      unit,
      costPrice,
      salePrice,
      lowStockThreshold,
    } = req.body;

    if (name && name !== item.name) {
      const existingItem = await Inventory.findOne({ name });
      if (existingItem) {
        return res.status(400).json({
          message: "Item with this name already exists",
        });
      }
    }

    item.name = name || item.name;
    item.partNumber = partNumber !== undefined ? partNumber : item.partNumber;
    item.supplier = supplier !== undefined ? supplier : item.supplier;
    item.quantity = quantity !== undefined ? quantity : item.quantity;
    item.unit = unit || item.unit;
    item.costPrice = costPrice !== undefined ? costPrice : item.costPrice;
    item.salePrice = salePrice !== undefined ? salePrice : item.salePrice;
    item.lowStockThreshold =
      lowStockThreshold !== undefined
        ? lowStockThreshold
        : item.lowStockThreshold;

    await item.save();

    res.json({
      success: true,
      message: "Item updated successfully",
      item,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Manager)
export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    await item.deleteOne();

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Get low stock items
// @route   GET /api/inventory/low-stock
// @access  Private (Manager)
export const getLowStock = async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ["$quantity", "$lowStockThreshold"] },
    }).sort({ quantity: 1 });

    res.json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("Error fetching low stock:", error);
    res.status(500).json({ message: "Server error" });
  }
};
