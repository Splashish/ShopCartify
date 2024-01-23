const session = require('express-session');
const mongoose = require('mongoose');
const adminCollection = require('../model/adminCollection')
const userCollection = require('../model/userCollection');
const productCollection = require('../model/productCollection');
const CategoryCollection = require('../model/categoryCollection');
const orderCollection = require('../model/orderCollection');
const addressCollection = require('../model/addressCollection');
const returnCollection = require('../model/returnCollection');
const walletCollection = require('../model/walletCollection');
const couponCollection = require('../model/couponCollection');

const sharp = require('sharp');

const { log } = require('console');

const multer = require('multer');

const uploads = multer({ dest: "public/uploads" });


const dashboardForAdmin = async (req, res) => {
  const fullData  = await orderCollection.find();
  console.log("fullData is :",fullData);
  res.render('admin/dashboard',{fullData});
}

const dashboard = async (req, res) => {
  try {
    if (req.session.admin) {  
      const fullData  = await orderCollection.find();
      res.render('admin/dashboard',{fullData});
    } else {
      res.redirect("/admin/login");
    }
  } catch (error) {
    console.error(error);
    // res.status(500).render('error', { error: 'An error occurred in the dashboard.' });
  }
};

const adminlogin = async (req, res) => {
  if (req.session.admin) {
    const users = await userCollection.find();
    const fullData  = await orderCollection.find();
    res.render('admin/dashboard', { users,fullData });
  } else {
    res.render('admin/login')
  }
};

const postlogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await adminCollection.findOne({ username: username, password: password });
    const users = await userCollection.find();
    const fullData  = await orderCollection.find();
    if (admin.password === password) {
      req.session.admin = username;

      const users = await userCollection.find()
      console.log("user", users);

      res.render('admin/dashboard', { users,fullData })
    }
  } catch (error) {
    console.log(error);
    res.render('admin/login');
  }
};


const createPost = async (req, res) => {
  const createData = {
    username: username,
    password: password,
    email: email
  }

  await adminCollection.create(createData);
  console.log("admin created a user");
  res.redirect('/admin/dashboard');
};

const blockid = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await userCollection.findByIdAndUpdate(id, { isblocked: true });

    if (!user) {
      res.status(400).json({ error: 'User not found or could not be blocked' });
    } else {
      res.redirect('/admin/usermanage');
    }
  } catch (error) {
    console.error(error.message);
    res.send( error.message );
  }
};


const unblockid = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await userCollection.findByIdAndUpdate(id, { isblocked: false });

    if (!user) {
      res.status(400).json({ error: 'User not found or could not be unblocked' });
    }
    res.redirect('/admin/usermanage');
  } catch (error) {
    console.error(error.message);
    res.send(error.message);
  }
};


const ITEMS_PER_PAGE = 10; 
const usermanage = async (req, res) => {
  const page = parseInt(req.query.page) || 1; //neede page requesting
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const users = await userCollection.find().skip(skip).limit(ITEMS_PER_PAGE);
  
  const totalCount = await userCollection.countDocuments();

  res.render("admin/userManagement", { users, currentPage: page, totalPages: Math.ceil(totalCount / ITEMS_PER_PAGE) });
};


const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    else {

      res.redirect('/admin/login')
    }
  });
};


const productmanage = async (req, res) => {
  try {
    res.render("admin/productAdd");
  } catch (error) {
    console.log("error in productlist", error);
  }
};


// const productmanagePost = async (req, res) => {
//   try {
//     // Call the Multer middleware to handle file uploads
//     console.log("req.files", req.files);

//     // Array to store paths of cropped images
//     const croppedImages = [];

//     // Loop through each uploaded image and crop it
//     for (const file of req.files) {
//       console.log("file is:",file);

//       const croppedImagePath = `public/uploads/cropped${file.filename}`; 
//       // const croppedImagePath = path.join('public', 'uploads', 'cropped', `${file.filename}`);

//       await sharp(file.path)
//         .resize({ width: 300, height: 300 })
//         .toFile(croppedImagePath);

//       croppedImages.push(croppedImagePath);
//     }

//     console.log("croppedImages", croppedImages);

//     console.log('body', req.body);
//     const productDetails = {
//       name: name,
//       price: price,
//       currency: currency,
//       category: category,
//       stock: stock,
//       description: description,
//       Images: croppedImages
//     };

//     const Product = await productCollection.insertMany([productDetails]);

//     if (productDetails && Product) {
//       res.redirect('/admin/productlist');
//     } else {
//       res.redirect('/admin/productAdd');
//     }
//   } catch (error) {
//     console.log('error in add post*');
//     console.log(error);
//   }
// };

const productmanagePost = async (req, res) => {
  try {
    console.log("req.files", req.files);
    console.log("Product management Post Image is updating");
    const images = req.files.map(file => `public/uploads/${file.filename}`);

    console.log('body', req.body);
   console.log("name of the product in the productManagePost",req.body.Name);
    const productDetails = {
      name:req.body.Name,
      price:req.body.price,
      category:req.body.category,
      stock:req.body.stock,
      description:req.body.description,
      Discount:req.body.Discount,
      Images:images,
    };

    // Assuming `productCollection` is defined somewhere in your code
    const Product = await productCollection.insertMany([productDetails]);

    if (productDetails && Product) {
      res.redirect('/admin/productlist');
    } else {
      res.redirect('/admin/productAdd');
    }
  } catch (error) {
    console.log('error in add post*');
    console.log(error.message);
    res.status(500).send('Internal Server Error');
  }
};

// module.exports = {
//   productmanagePost,
// };

const productlist = async (req, res) => {
  try {
    let query = {};
    const searchTerm = req.query.search;
 
    if (searchTerm) {
      query = { $or: [{ name: { $regex: searchTerm, $options: 'i' } }], deleted: false };
    } else {
      query = { deleted: false };
    }
 
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
 
    const totalProducts = await productCollection.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / limit);
 
    const skip = (page - 1) * limit;
    const products = await productCollection.find(query).skip(skip).limit(limit);
    const fullProducts = await productCollection.find();
    const categories = await CategoryCollection.find();
    res.render("admin/productManagement", {
      categories,
      fullProducts,
      products,
      currentPage: page,
      totalPages,
      searchTerm,
    });
  } catch (error) {
    console.error("Error in productlist:", error);
    res.status(500).send("Internal Server Error");
  }
 };
 


const productDelete = async (req, res) => {
  try {
    const productId = req.params.id;

    // Validate ObjectId to prevent invalid queries
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      console.log("Invalid product ID");
      return res.status(400).send("Invalid product ID");
    }

    // Soft delete by updating the 'deleted' field
    const newResult = await productCollection.findByIdAndUpdate(
      productId,
      { $set: { deleted: true } },
      { new: true }
    );

    if (newResult) {
      res.redirect('/admin/productlist');
    } else {
      console.log("Product not found");
      res.status(404).send("Product not found");
    }
  } catch (error) {
    console.error("Error deleting product:", error);
    res.send(error.message)
  }
};

const updateproduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await productCollection.findById(productId);
    const { name, description, price, stock,Discount } = req.body;
    console.log("the discount  of the product is:", Discount);
    // Handling Images separately
    let updatedImages = product.Images;

    if (req.files && req.files.length > 0) {
      updatedImages = req.files.map(file => `public/uploads/${file.filename}`);
    }

    const updatedProduct = await productCollection.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        price,
        stock,
        Discount,
        Images: updatedImages,
      },
      { new: true }
    );
  
    if (!updatedProduct) {
      console.error("Product not found for update");
      return res.status(404).send("Product not found");
    }

    res.redirect("/admin/productlist");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Internal Server Error");
  }
};


const editproduct = async (req, res) => {
  try {
    const id = req.params.id;
    console.log("THE ID IS:", id);
    const product = await productCollection.findById(id);
    console.log("THE PROUDUCT IS:", product)
    if (product) {
      res.render("admin/productedit", { product });
      console.log("*********");
    } else {
      res.redirect("/admin/productlist");
    }
  } catch (error) {
    console.error("Error in editproduct:", error);
    res.status(500).send("Internal Server Error");
  }
};


const categoryadd = async (req, res) => {
  res.render('admin/categoryAdd');
};

const categoryaddPost = async (req, res) => {
  const datas = {
    categoryName: categoryName,
    categoryDescription: categoryDescription,
  };

  try {
    const existingCategory = await CategoryCollection.findOne({ categoryName: { $regex: new RegExp('^' + datas.categoryName + '$', 'i') } });
    const categories = existingCategory;
    if (existingCategory) {
      // Category with the same name already exists
      return res.render('admin/categoryAdd', { categoryError: 'Category with the same name already exists', categories });
    }

    await CategoryCollection.create(datas);
    res.redirect("/admin/categorymanage");
  } catch (error) {
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
};


const categorymanage = async (req, res) => {
  try {
    // Assuming categoryCollection is your MongoDB collection
    // const categories = await CategoryCollection.find({ deleted: false });
    const categories = await CategoryCollection.find();
    const fullProducts = await productCollection.find();

    // res.render("admin/categoryManagement", { categories });
    res.render("admin/productManagement", { categories,fullProducts });

  } catch (error) {
    // Handle any errors, for example, log the error and render an error page
    console.error("Error fetching categories:", error);
  }
};


const categorydelete = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const result = await CategoryCollection.findByIdAndDelete(categoryId, { deleted: true });

    if (result) {
      res.redirect('/admin/categorymanage');
    } else {
      res.status(404).send('Category not found');
    }
  } catch (error) {
    console.error('Error in categorySoftDelete:', error);
    res.status(500).send('Internal Server Error');
  }
};

const categoryeditpage = async (req, res) => {
  console.log('editpage');
  try {
    console.log("the data  is here 1211212");
    const param = req.params.id;
    const categoriesData = await CategoryCollection.findById(param);
    const allCategories = await CategoryCollection.find();

    if (allCategories.length > 0) {
      res.render('admin/categoryedit', { categoriesData });
      console.log(categoriesData);
    } else {
      console.log('No categories found');
    }
  } catch (error) {
    console.log("Error in editpage:", error);
  }
};

const categoryedit = async (req, res) => {
  try {
    const categoryId = req.params.id;
    const updates = req.body; // Assuming updates are coming from the request body

    const result = await CategoryCollection.findByIdAndUpdate(categoryId, updates);

    if (result) {
      // Category updated successfully
      res.redirect("/admin/categorymanage"); // Redirect to the category management page
    } else {
      console.log('Error updating category');
    }
  } catch (error) {
    console.log(error);
    // Handle the error
  }
};

const orders = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    const limit = 10;

    // Calculate the skip value based on the page number
    const skip = (page - 1) * limit;

    // Fetch orders with pagination and populate productdetails
    const orders = await orderCollection
      .find()
      .populate('productdetails')
      .skip(skip)
      .limit(limit);

    // Count total orders for pagination
    const totalOrders = await orderCollection.countDocuments();

    // Calculate total pages based on the limit
    const totalPages = Math.ceil(totalOrders / limit);

    // res.render('admin/orders', {
      res.render('admin/dashboard', {
      orders,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send(error.message);
  }
};


const ordersPost = async (req, res) => {
  try {
    console.log(" HERE HERE HERE HERE HERE HERE HERE HERE HEREH HERE HERE HERE HERE");
      const orderId = req.params.id;
      const newStatus = orderStatus;
      const updatedOrder = await orderCollection.findByIdAndUpdate(
          orderId,
          { $set: { orderStatus: newStatus } },
          { new: true }
      );
 
      console.log("Updated Order:", updatedOrder);
      res.status(200).json(updatedOrder);
  } catch (error) {
      console.error(error.message);
      res.status(500).send(error.message);
  }    
 };
 
 const returnManage = async(req,res)=>{
  try{
    const orderData = await orderCollection.find();
    const returnDetails = await returnCollection.find();
    console.log("returndetails",returnDetails);
   res.render("admin/returnOrderManage",{orderData,returnDetails});
  }catch(error){
    res.send(error.messgae);
    console.log(error.message);
  }
 };
 const Approved = async (req, res) => {
  try {
    const orderId = req.params.id;
    const data = await returnCollection.findOne({ orderId: orderId });
    if (!data) {
      return res.status(404).json({ message: "Order not found" });
    }
    const constConfirmReturn = await returnCollection.findByIdAndUpdate(
      data._id,
      { $set: { status: "return approved", time: Date.now() } },
      { new: true }
    );
    if (constConfirmReturn.status === "return approved") {
      let walletSave = await walletCollection.findOne({ userId: data.userId });
      if (!walletSave) {
        let newWalletSave = new walletCollection({
          userId: data.userId,
          amounts: [data.amount],
        });
        await newWalletSave.save();
      } else {
        walletSave.amounts.push(data.amount);
        await walletSave.save();
      }
      res.json({ status: "return approved" });
    }
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};



const Denyed = async (req, res) => {
  try {
    console.log("111111");
    const orderId = req.params.id;
    const Data = await returnCollection.findOne({ orderId });

    console.log("entered into the admin denied section");
    console.log("22222");
    await returnCollection.findByIdAndUpdate(Data._id, { $set: { status: "return request rejected by admin" } });
    res.status(200).send({ status: "return rejected by admin" });
  } catch (error) {
    console.log("internal error in denied section ");
    res.status(500).send(error);
  }
};



module.exports = {
  dashboardForAdmin,
  dashboard,
  adminlogin,
  postlogin,
  // create,
  createPost,
  blockid,
  unblockid,
  usermanage,
  productmanage,
  productmanagePost,
  productlist,
  productDelete,
  categoryadd,
  updateproduct,
  editproduct,
  categorymanage,
  categorydelete,
  categoryeditpage,
  categoryedit,
  categoryaddPost,
  logout,
  orders,
  ordersPost,
  returnManage,
  Approved,
  Denyed,
}