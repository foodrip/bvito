const { request } = require('express');
let express = require(`express`);
let app = express();
let port = 3001;

app.listen(port, function () {
    console.log(`http://localhost:${port}`);
})


// Раздача статики
app.use(express.static(`public`));


// Настройка handlebars
const hbs = require('hbs');
app.set('views', 'views');
app.set('view engine', 'hbs');

// Настройка POST-запроса
app.use(express.urlencoded({ extended: true }))


// Настройка БД
let mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/bvito');

// Схемы
let schema = new mongoose.Schema({
    title: String,
    description: String,
    price: Number,
    category: String,
    image: String,
    isMine: Boolean
}, { 
    timestamps: true 
});

let Product = mongoose.model('product', schema);

// Роуты
app.get(`/`, async function (req, res) {
    let data = await Product.find().limit(10);

    res.render('index', {array: data});   
});


/* 1. ВСЕ ОБЪЯВЛЕНИЯ */

// Поиск с помощью формы
app.get(`/search`, async function (req, res) {
    let title = req.query.title;
    let category = req.query.category;
    let sort = Number(req.query.sort);

    let search = {}; // объект настроек поиска
    let sorting = {}; // объект настроек сортировки

    // Наполняем объекты данными
    if (title) {
        search.title = title;
    }
    if (category) {
        search.category = category;
    }
    if (sort) {
        sorting.price = sort;
    }

    // Свершаем поиск!
    let data = await Product.find(search)
                            .sort(sorting)
                            .limit(10);
    
    res.render('index', {array: data});   
});


/* 2. СОЗДАНИЕ ОБЪЯВЛЕНИЯ */

// Страница "Мои объявления"
app.get(`/my`, async function (req, res) {
    let error = req.query.error;
    let success = req.query.success;

    let data = await Product
                        .find({isMine: true})
                        .sort({createdAt: -1});

    res.render(`my`, {
        array: data,
        error: error,
        success: success
    });
});


// Создание
app.post(`/create`, async function (req, res) {
    let title = req.body.title;
    let description = req.body.description;
    let category = req.body.category;
    let price = Number(req.body.price);

    // Проверка обязательных полей
    if (!title || !description || !category || !price) {
        res.redirect('/my?error=1');
        return;
    }

    // Проверка дублей
    let double = await Product.exists({title: title});
    if (double) {
        res.redirect('/my?error=1');
        return;
    } 

    // Дефолтное изображение
    let image = req.body.image;
    if (!image) {
        image = 'icons/no-image.png';
    }

    // Создание модели товара
    let product = new Product({
        title: title,
        description: description,
        category: category,
        price: price,
        image: image,
        isMine: true
    })

    await product.save();
    res.redirect(`/my?success=1`);
});


// Удаление
app.get(`/remove`, async function (req, res) {
    let id = req.query.id;

    await Product.deleteOne({_id: id});

    res.redirect(`/my`);
});


/* 2. РЕДАКТИРОВАНИЕ */

// Страница редактирования
app.post(`/edit`, async function (req, res) {
    let id = req.query.id;
    let product = await Product.findOne({_id: id});

    product.title = req.body.title;
    product.price = Number(req.body.price);
    product.description = req.body.description;
    product.image = req.body.image;
    
    await product.save();

    res.redirect(`/edit?=${{id}}`);
})
