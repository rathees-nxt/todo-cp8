const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperties = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperties = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodoQuery = ''
  const {search_q = '', status, priority} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}' AND priority='${priority}';`
      break
    case hasPriorityProperties(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}';`
      break
    case hasStatusProperties(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}';`
      break
    default:
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`
  }
  data = await db.all(getTodoQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const getIdPlayer = request.params
  const {todoId} = getIdPlayer
  const getIdPlayerQuery = `select * from todo where id=${todoId}`
  const getIdPlayerArray = await db.get(getIdPlayerQuery)
  response.send(getIdPlayerArray)
})

app.post('/todos/', async (request, response) => {
  const createList = request.body
  const {id, todo, priority, status} = createList
  const addTodoTable = `insert into todo (id, todo, priority, status) values (${id}, '${todo}', '${priority}', '${status}')`
  await db.run(addTodoTable)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  let {todoId} = request.params
  let requestBody = request.body
  let updatedDetails = ''
  switch (true) {
    case requestBody.status !== undefined:
      updatedDetails = 'Status'
      break
    case requestBody.priority !== undefined:
      updatedDetails = 'Priority'
      break
    case requestBody.todo !== undefined:
      updatedDetails = 'Todo'
      break
  }
  const getDetailUpdatingQuery = `select * from todo where id=${todoId}`
  const getDetailUpdating = await db.get(getDetailUpdatingQuery)
  const {
    todo = getDetailUpdating.todo,
    priority = getDetailUpdating.priority,
    status = getDetailUpdating.status,
  } = request.body
  const updateTodoQuery = `update todo set todo = '${todo}',priority='${priority}',status='${status}' where id=${todoId}`
  await db.run(updateTodoQuery)
  response.send(`${updatedDetails} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `Delete from todo where id=${todoId}`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
