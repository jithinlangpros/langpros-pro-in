# SIMPLE - Understanding the Tables

## The Confusion

You're right to be confused! Let me clarify:

| Table | What it is | Example |
|-------|------------|---------|
| **categories** | The GROUP (broad) | Video, Audio, IT |
| **subcategories** | The TYPE (specific) | Cameras, Mixers, Laptops |
| **models** | The PRODUCT TEMPLATE | Sony FX6, MacBook Pro |
| **items** | THE ACTUAL ASSETS | Your real physical items |

---

## Think of it like this:

```
categories (Group)
    ↓
subcategories (Type)
    ↓
models (Product Definition - like a form template)
    ↓
items (Actual Physical Items - the real thing!)
```

---

## Example: Cameras

### categories
| code | name |
|------|------|
| VID | Video |

### subcategories
| code | name | category |
|------|------|----------|
| CAM | Cameras | VID |

### models (Product Template)
| code | name | brand |
|------|------|-------|
| FX6 | Sony PXW-FX6 | Sony |
| KOMODO | RED Komodo | RED |

### items (ACTUAL ASSETS)
| sku | serial_number | model | status | location |
|-----|---------------|-------|--------|----------|
| SNY-FX6-001 | SN12345 | Sony FX6 | Available | WH-A |
| SNY-FX6-002 | SN12346 | Sony FX6 | Rented | Client A |
| RED-KOMODO-001 | RD99999 | RED Komodo | Available | WH-B |

---

## 4 Tables You Actually Need

### Table 1: categories
Groups like Video, Audio, IT

### Table 2: subcategories
Types like Cameras, Mixers, Laptops

### Table 3: models
Product definitions (Sony FX6, MacBook Pro, XLR Cable 10m)

### Table 4: items
**YOUR ACTUAL INVENTORY** - the real physical items with serial numbers

---

## Simple Explanation

| Table | Purpose |
|-------|---------|
| **categories** | Just for organizing (Video, Audio) |
| **subcategories** | Just for organizing (Cameras, Speakers) |
| **models** | Defines WHAT products you have (like a product catalog) |
| **items** | WHERE YOU TRACK YOUR ACTUAL STUFF |

---

## Real Example: Your Inventory

### models (Product Catalog)
| id | subcategory | brand | code | name | type |
|----|-------------|-------|------|------|------|
| 1 | CAM | Sony | FX6 | Sony PXW-FX6 | serial |
| 2 | LAP | Apple | MBP | MacBook Pro | serial |
| 3 | XLR | Canare | XLR10M | XLR Cable 10m | quantity |

### items (Your Actual Assets)
| sku | serial_number | model_id | status | location |
|-----|---------------|----------|--------|----------|
| SNY-FX6-001 | SN12345 | 1 (FX6) | Available | WH-A |
| SNY-FX6-002 | SN12346 | 1 (FX6) | Rented | Event |
| APL-MBP-001 | C02X123 | 2 (MBP) | Available | Office |
| CANA-XLR10M-001 | - | 3 (XLR10M) | Available | CAB-BIN |
| CANA-XLR10M-002 | - | 3 (XLR10M) | Available | CAB-BIN |
| CANA-XLR10M-003 | - | 3 (XLR10M) | Rented | Event |

---

## Summary

- **models** = What product types you have (like a menu)
- **items** = Your actual physical inventory (the food on the table)

You need BOTH - models to define the product, and items to track each physical piece!
