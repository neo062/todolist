//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const _ = require("lodash");

const mongoose = require("mongoose");
const app = express();
//set view floder
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.set('strictQuery', true);
//mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});
mongoose.connect("mongodb://127.0.0.1:27017/todolistDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log("database connected");
  })
  .catch(err => {
    console.log("Could not connect", err);
  });
// creating schema for item
const itemsSchema = {
  name: String
};
// creating schema for customListName
const listSchema = {
  name : String,
  items: [itemsSchema]
};
// creating Model for list
const List = mongoose.model("List", listSchema);
// creating Model for Item
const Item = mongoose.model("item" , itemsSchema);

// creating document of model Item
const item1 = new Item ({
  name: "Welcome to to do list"
});
const item2 = new Item ({
  name: "Hit the button  + to add new thing "
});
const item3 = new Item ({
  name: "Hit the button to delete "
});

const defaultItems =[item1,item2,item3];



// Routing on server
app.get("/", function(req, res) {


  Item.find({} ,function(err,foundItems){

  if(foundItems.length === 0){
    Item.insertMany(defaultItems,function(err){
      if(err){
        console.log(err);
      }else{
        console.log("inserted successfully");
      }
    });
    res.redirect("/");
  }else{
    res.render("list", {listTitle: "Today", newListItems: foundItems});

  }
  });
});
// Here we using express Routing method
app.get('/:customListName', function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName},function(err, foundlist){
    if(!err){
      if(!foundlist){
        // creating a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/" + customListName);
      }
     else{
       // Showing an existing list
        res.render("list", {listTitle: foundlist.name, newListItems: foundlist.items});
     }
   }
 });


});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
// creating new item
  const item = new Item({
    name: itemName
  });
  if(listName === "Today"){
    item.save();
  res.redirect("/");
}else{
    List.findOne({name: listName},function(err,foundlist){
      foundlist.items.push(item);
      foundlist.save();
      res.redirect("/" + listName);
    })
}
});

app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if(listName === "Today"){
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if(!err){
        console.log("successfully deleted checked item");
        res.redirect("/");
      }
  });
}else{
  List.findOneAndUpdate({name:listName},{$pull:{items: {_id:checkedItemId}}},function(err,foundlist){
    if(!err){
      res.redirect("/" + listName);
    }
  })
}


});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
