import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const seedData = [
  {
    title: "Blue & Green Minimalist Abstract Painting",
    description: "Contemporary abstract artwork featuring bold geometric shapes in vibrant blue and green hues. A stunning piece perfect for modern living spaces. Signed by the artist.",
    category: "artwork",
    startingPrice: 45000,
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663501709011/UJnBZ89CVdWwpYybdHpYK5/s9QaFctbCrt4_41ce2ef1.jpg",
  },
  {
    title: "Modern Luxury Abstract Wall Art",
    description: "Extra large framed abstract painting with metallic accents. Professional gallery-quality frame. Dimensions: 120cm x 80cm. Excellent investment piece.",
    category: "artwork",
    startingPrice: 35000,
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663501709011/UJnBZ89CVdWwpYybdHpYK5/EvZWHo5pPOlw_dc819c9e.jpg",
  },
  {
    title: "Orange Geometric Canvas Wall Art",
    description: "Vibrant geometric composition in warm orange and neutral tones. Perfect for contemporary interiors. Canvas on stretcher frame, ready to hang.",
    category: "artwork",
    startingPrice: 28000,
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663501709011/UJnBZ89CVdWwpYybdHpYK5/FNP3ydCLldXK_21aa2d48.jpg",
  },
  {
    title: "Victorian Era Antique Furniture Collection",
    description: "Authentic Victorian period furniture featuring ornate wooden designs with brass fittings. Includes detailed carvings and original upholstery. Circa 1880s.",
    category: "furniture",
    startingPrice: 120000,
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663501709011/UJnBZ89CVdWwpYybdHpYK5/qx6C6JVAYK56_f26cf128.jpg",
  },
  {
    title: "Antique Victorian Settee",
    description: "Beautiful Victorian settee with cream-colored upholstery and mahogany frame. Features ornate carved details and rolled arms. Excellent condition for age.",
    category: "furniture",
    startingPrice: 65000,
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663501709011/UJnBZ89CVdWwpYybdHpYK5/HNzwmKAhgkgB_e4c24465.jpg",
  },
  {
    title: "Victorian Inlaid Console Table",
    description: "Ornate Victorian console table with intricate marquetry inlay work. Features brass fittings and turned legs. Circa 1870. Stunning craftsmanship.",
    category: "furniture",
    startingPrice: 85000,
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663501709011/UJnBZ89CVdWwpYybdHpYK5/IhSB3gjBatTA_25d31f5e.jpg",
  },
  {
    title: "Marble Bust of Alexander the Great",
    description: "Classical marble sculpture depicting Alexander the Great. Hand-carved from white marble. Museum-quality reproduction. Height: 45cm. Comes with wooden base.",
    category: "collectible",
    startingPrice: 95000,
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663501709011/UJnBZ89CVdWwpYybdHpYK5/hmTwwfcz84Bs_603793a6.jpg",
  },
  {
    title: "Classical Marble Portrait Bust",
    description: "Neoclassical marble bust featuring fine sculptural details. Carved from premium Carrara marble. Height: 38cm. Signed by contemporary sculptor.",
    category: "collectible",
    startingPrice: 72000,
    imageUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663501709011/UJnBZ89CVdWwpYybdHpYK5/Paw59CoSQmQw_7298a3dd.jpg",
  },
];

// Create 12 more items with varied data
const additionalItems = [
  {
    title: "18K Gold Diamond Necklace",
    description: "Vintage 18K gold necklace featuring 2.5 carats of brilliant-cut diamonds. Hallmarked and certified. Elegant design from 1960s.",
    category: "jewelry",
    startingPrice: 180000,
  },
  {
    title: "Antique Pearl Brooch",
    description: "Victorian-era brooch set with natural pearls and seed pearls. Gold-plated silver setting. Excellent condition.",
    category: "jewelry",
    startingPrice: 42000,
  },
  {
    title: "Art Deco Emerald Ring",
    description: "Stunning Art Deco ring featuring 3-carat natural emerald surrounded by diamonds. Platinum setting. Certificate of authenticity included.",
    category: "jewelry",
    startingPrice: 250000,
  },
  {
    title: "Chinese Ming Dynasty Vase",
    description: "Blue and white porcelain vase from Ming Dynasty. Hand-painted with traditional motifs. Height: 35cm. Museum documentation available.",
    category: "antique",
    startingPrice: 380000,
  },
  {
    title: "Japanese Meiji Period Sculpture",
    description: "Bronze sculpture from Meiji period featuring intricate details. Signed by master craftsman. Height: 28cm.",
    category: "collectible",
    startingPrice: 125000,
  },
  {
    title: "Vintage Rolex Submariner Watch",
    description: "Rare vintage Rolex Submariner from 1970. Original dial and hands. Fully functional. Complete with original box and papers.",
    category: "collectible",
    startingPrice: 320000,
  },
  {
    title: "First Edition Shakespeare Folio",
    description: "Rare first edition of Shakespeare's Complete Works (1623). Leather-bound. Excellent condition for age. Certificate of authenticity.",
    category: "collectible",
    startingPrice: 450000,
  },
  {
    title: "Antique Persian Kilim Rug",
    description: "Hand-woven Persian Kilim rug from 1920s. Traditional geometric patterns in rich colors. Size: 3m x 2m. Excellent condition.",
    category: "furniture",
    startingPrice: 95000,
  },
  {
    title: "Tiffany Stained Glass Lamp",
    description: "Authentic Tiffany-style stained glass lamp with bronze base. Handcrafted glass pieces. Height: 62cm. Fully functional.",
    category: "furniture",
    startingPrice: 75000,
  },
  {
    title: "Impressionist Landscape Painting",
    description: "Oil on canvas landscape in the style of French Impressionists. Signed and dated 1925. Dimensions: 60cm x 45cm. Framed.",
    category: "artwork",
    startingPrice: 55000,
  },
  {
    title: "Contemporary Sculpture - Abstract Form",
    description: "Modern bronze sculpture featuring abstract geometric forms. Limited edition (5/25). Height: 75cm. Comes with certificate.",
    category: "artwork",
    startingPrice: 88000,
  },
  {
    title: "Vintage Leica M3 Camera",
    description: "Classic Leica M3 rangefinder camera from 1954. Fully functional. Includes original lens and leather case. Excellent condition.",
    category: "collectible",
    startingPrice: 48000,
  },
];

async function seedDatabase() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);

  try {
    console.log("🌱 Starting database seeding...");

    // Get the first user (admin) to use as seller
    const [users] = await connection.query("SELECT id FROM users LIMIT 1");
    if (!users || users.length === 0) {
      console.error("❌ No users found. Please create a user first.");
      process.exit(1);
    }

    const sellerId = users[0].id;
    console.log(`📝 Using seller ID: ${sellerId}`);

    // Combine all items
    const allItems = [...seedData, ...additionalItems];

    // Insert items
    for (let i = 0; i < allItems.length; i++) {
      const item = allItems[i];
      const now = Date.now();
      const endTime = now + 7 * 24 * 60 * 60 * 1000; // 7 days from now

      const query = `
        INSERT INTO items (
          sellerId, title, description, category, 
          startingPrice, currentPrice, imageUrl, endTime, status, bidCount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(query, [
        sellerId,
        item.title,
        item.description,
        item.category,
        item.startingPrice,
        item.startingPrice, // currentPrice = startingPrice initially
        item.imageUrl || null,
        endTime,
        "active",
        0,
      ]);

      console.log(`✅ [${i + 1}/${allItems.length}] Added: ${item.title}`);
    }

    console.log(`\n🎉 Successfully seeded ${allItems.length} auction items!`);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedDatabase();
