const express = require('express')
const expressLayouts = require('express-ejs-layouts')
require('./utils/db')
const Contact = require('./models/contacts')
const session = require("express-session")
const cookieParser = require("cookie-parser")
const flash = require("connect-flash")
const { body, validationResult, check } = require("express-validator")
const methodOverride = require('method-override')

const app = express()
const port = 3000

// Setup EJS
app.set('view engine', 'ejs')
app.use(expressLayouts);
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
// configuration for flash message
app.use(cookieParser('secret'))
app.use(session({
    cookie: { maxAge: 6000 },
    secret: 'secret',
    resave: true,
    saveUninitialized: true
})
)
app.use(flash());
app.use(methodOverride('_method'))

// Halaman Home
app.get('/', (req, res) => {
    res.render('index', {
        title: "Home",
        layout: 'layouts/main'
    })
})
app.get('/about', (req, res) => {
    res.render('about', {
        title: "About",
        layout: 'layouts/main'
    })
})
app.get("/contact", async (req, res) => {
    const contacts = await Contact.find()
    res.render("contact", {
        title: "Contact",
        layout: "layouts/main",
        contacts,
        msg: req.flash('msg'),
    });
});
// delete contact without restfull api style "delete"
// app.get('/contact/delete/:id', async (req, res) => {
//     const contact = await Contact.findOne({_id : req.params.id })
//     // checking contact
//     if (!contact) {
//         res.status(404);
//         res.render("error", {
//             title: "Error 404: File not found",
//             layout: "layouts/main",
//         });
//     } else {
//         Contact.deleteOne({_id : contact._id}).then((error, result) => {
//             req.flash('msg', "Data successfully deleted!")
//             res.redirect("/contact")
//         })
//     }
// })

// delete contact with delete method
app.delete('/contact', (req, res) => {
    Contact.deleteOne({_id : req.body.id}).then((error, result) => {
        req.flash('msg', "Data successfully deleted!")
        res.redirect("/contact")
    })
})
// edit data view
app.get('/contact/edit/:id', async (req, res) => {
    const contact = await Contact.findOne({_id : req.params.id })
    res.render("edit-contact", {
        title: "Edit Data Contact",
        layout: "layouts/main",
        contact,
    });
})
// edit data process
app.put('/contact', 
    [
        body('name').custom(async (value, {req}) => {
            const duplicate = await Contact.findOne({name: value})
            if (value !== req.body.oldName && duplicate) {
                throw new Error('Name already in')
            }
            return true 
        }),
        check("email", "Email is not valid").isEmail(),
        check("number", "Number Phone not valid").isMobilePhone("id-ID")
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render("edit-contact", {
                title: "Edit Data Contact",
                layout: "layouts/main",
                contact: req.body,
                errors: errors.array()
            });
        } else {
            Contact.updateOne(
                { _id : req.body.id },
                {
                    $set : {
                        name: req.body.name,
                        number: req.body.number,
                        email: req.body.email
                    }
                }
            ).then((result) => {
                // send flash message 
                req.flash('msg', 'Contact successfuly updated!')
                res.redirect("/contact");
            })
        }
})
// show detail contact by id from table in view contact
app.get("/contact/:id", async (req, res) => {
    const contact = await Contact.findOne({_id : req.params.id })
    res.render("detail", {
        title: "Detail Contact",
        layout: "layouts/main",
        contact,
    });
});
// add new contact
app.post(
    "/contact",
    [
        body("name").custom(async (value) => {
            const duplicate = await Contact.findOne({name: value})
            if (duplicate) {
                throw new Error('Name already in')
            }
            return true
        }),
        check("email", "Email is not valid").isEmail(),
        check("number", "Number Phone not valid").isMobilePhone("id-ID")
    ],
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.render("index", {
                title: "Home",
                layout: "layouts/main",
                errors: errors.array()
            });
        } else {
            Contact.insertMany(req.body, (error, result)=> {
                // send flash message
                req.flash('msg', 'Contact successfuly added!')
                res.redirect("/contact");
            })
        }
    }
);
// show view about
app.get("/about", (req, res) => {
    res.render("about", {
        title: "about",
        layout: "layouts/main",
    });
});

// show error view
app.use("/", (req, res) => {
    res.status(404);
    res.render("error", {
        title: "Error 404: File not found",
        layout: "layouts/main",
    });
});
app.listen(port, () => {
    console.log(`Express-Mongo Contact App is running on http://localhost:${port}`)
})