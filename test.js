import axios from "axios"
import express from "express"
import cors from "cors"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import * as dotenv from "dotenv"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const secret = process.env.DB_SECRET

import userModel from "./models/userModel.js"

mongoose.set("strictQuery", false)

const linkDB = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3v8vfkh.mongodb.net/MovieList?retryWrites=true&w=majority`

mongoose
  .connect(linkDB)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err))

app.use(cors())
app.use(express.json())

/* ========================= */
/* ===== MIDDLEWARE ======== */
/* ========================= */

function checktoken(req, res, next) {
  const authHeader = req.headers["authorization"]

  if (!authHeader) {
    return res.status(401).json({ msg: "Acesso negado" })
  }

  const token = authHeader.split(" ")[1]

  try {
    jwt.verify(token, secret)
    next()
  } catch (err) {
    return res.status(401).json({ msg: "Token inválido" })
  }
}

/* ========================= */
/* ===== AUTH ============== */
/* ========================= */

app.post("/login", async (req, res) => {
  try {
    const { name, password } = req.body
    const user = await userModel.findOne({ name })

    if (!user) return res.status(401).json({ msg: "Dados errados" })

    const checkPassword = await bcrypt.compare(password, user.password)
    if (!checkPassword)
      return res.status(401).json({ msg: "Senha inválida" })

    const token = jwt.sign({ id: user._id }, secret, {
      expiresIn: "7d",
    })

    user.token = token
    await user.save()

    user.password = null

    res.status(200).json({ user, token })
  } catch (err) {
    res.status(500).json({ error: "Erro no login" })
  }
})

app.post("/subscribe", async (req, res) => {
  try {
    const { name, password } = req.body

    if (!name || !password)
      return res.status(422).json({ msg: "Dados inválidos" })

    const userexist = await userModel.findOne({ name })
    if (userexist)
      return res.status(409).json({ msg: "Usuário já existe" })

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    const user = new userModel({ name, password: passwordHash })
    await user.save()

    res.status(200).json({ msg: "Usuário criado com sucesso" })
  } catch (err) {
    res.status(500).json({ error: "Erro ao criar usuário" })
  }
})

/* ========================= */
/* ===== LISTA ============= */
/* ========================= */

app.post("/addlist", checktoken, async (req, res) => {
  try {
    const { list, id } = req.body
    const user = await userModel.findById(id)

    const exists = user.list.find((e) => e.id === list.id)

    if (exists) {
      user.list = user.list.filter((e) => e.id !== list.id)
      await user.save()
      return res.status(200).json({ msg: "Item removido da lista" })
    }

    user.list.push(list)
    await user.save()

    res.status(200).json({ msg: "Item adicionado à lista" })
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar lista" })
  }
})

/* ========================= */
/* ===== HOME ============== */
/* ========================= */

app.get("/", async (req, res) => {
  try {
    const api = {
      params: {
        api_key: process.env.API_KEY,
        language: "en-US",
      },
    }

    const responses = await Promise.all([
      axios.get("https://api.themoviedb.org/3/movie/popular?page=1", api),
      axios.get("https://api.themoviedb.org/3/movie/popular?page=2", api),
      axios.get("https://api.themoviedb.org/3/tv/popular?page=1", api),
      axios.get("https://api.themoviedb.org/3/movie/top_rated?page=1", api),
      axios.get("https://api.themoviedb.org/3/movie/upcoming?page=1", api),
    ])

    res.status(200).json(responses.map((r) => r.data))
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: "Erro ao buscar dados do TMDB" })
  }
})

/* ========================= */
/* ===== MOVIES ============ */
/* ========================= */

app.get("/movies", async (req, res) => {
  try {
    const api = {
      params: {
        api_key: process.env.API_KEY,
        language: "en-US",
      },
    }

    const responses = await Promise.all([
      axios.get("https://api.themoviedb.org/3/movie/popular?page=1", api),
      axios.get("https://api.themoviedb.org/3/movie/popular?page=2", api),
      axios.get("https://api.themoviedb.org/3/movie/top_rated?page=1", api),
      axios.get("https://api.themoviedb.org/3/movie/upcoming?page=1", api),
      axios.get("https://api.themoviedb.org/3/discover/movie?with_genres=28", api), // ação
      axios.get("https://api.themoviedb.org/3/discover/movie?with_genres=35", api), // comédia
      axios.get("https://api.themoviedb.org/3/discover/movie?with_genres=18", api), // drama
      axios.get("https://api.themoviedb.org/3/discover/movie?with_genres=878", api), // ficção científica
    ])

    res.status(200).json(responses.map((r) => r.data))
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: "Erro ao buscar filmes" })
  }
})

/* ========================= */
/* ===== SERIES ============ */
/* ========================= */

app.get("/series", async (req, res) => {
  try {
    const api = {
      params: {
        api_key: process.env.API_KEY,
        language: "en-US",
      },
    }

    const responses = await Promise.all([
      axios.get("https://api.themoviedb.org/3/tv/popular?page=1", api),
      axios.get("https://api.themoviedb.org/3/tv/popular?page=2", api),
      axios.get("https://api.themoviedb.org/3/tv/top_rated?page=1", api),
      axios.get("https://api.themoviedb.org/3/discover/tv?with_genres=10759", api), // ação/aventura
      axios.get("https://api.themoviedb.org/3/discover/tv?with_genres=16", api), // animação
      axios.get("https://api.themoviedb.org/3/discover/tv?with_genres=35", api), // comédia
      axios.get("https://api.themoviedb.org/3/discover/tv?with_genres=18", api), // drama
    ])

    res.status(200).json(responses.map((r) => r.data))
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: "Erro ao buscar séries" })
  }
})

/* ========================= */

app.listen(PORT, () => console.log(`Listening on ${PORT}`))
