const mysql = require('mysql2');
const inquirer = require('inquirer');


const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'myRoot',
  database: 'company_db'
}).promise();

const dbFunctions = [
  {
    name: 'selectedFunction',
    message: 'Choose a database function:',
    type: 'list',
    choices: [
      'View all departments',
      'View all roles',
      'View all employees',
      'Add a department',
      'Add a role',
      'Add an employee',
      'Update an employee role',
      'Exit'
    ]
  }
];

const promptUser = async () => {
  try {
    const data = await inquirer.prompt(dbFunctions)
    const { selectedFunction } = data
    handleSelectedFunction(selectedFunction)
  } catch (err) {
    console.error(err)
  }
};

const handleSelectedFunction = (selectedFunction) => {
  switch (selectedFunction) {
    case 'View all departments':
      viewAllDepartments();
      break;
    case 'View all roles':
      viewAllRoles();
      break;
    case 'View all employees':
      viewAllEmployees();
      break;
    case 'Add a department':
      addNewDepartment();
      break;
    case 'Add a role':
      addNewRole();
      break;
    case 'Add an employee':
      addNewEmployee();
      break;
    case 'Update an employee role':
      updateEmployeeRole();
      break;
    case 'Exit':
      console.clear();
      process.exit();
  }
};

// GET ALL QUERIES
const viewAllDepartments = async () => {
  console.clear();
  try {
    const [results, info] = await db.query('SELECT id, names AS Department FROM department')
    console.clear();
    console.table(results)
    promptUser();
  } catch (err) {
    console.error(err)
    promptUser()
  }
};

const viewAllRoles = async () => {
  console.clear();
  try {
    const [results, info] = await db.query('SELECT role.id, title AS Title, salary, department.names AS Department FROM roles AS role INNER JOIN department ON role.department_id=department.id')
    console.clear();
    console.table(results)
    promptUser();
  } catch (err) {
    console.error(err)
    promptUser();
  }
};

const viewAllEmployees = async () => {
  console.clear();
  try {
    const [results, info] = await db.query('SELECT employee.id, first_name, last_name, role.title AS Title, department.names AS Department, role.salary, manager.first_name AS Manager FROM employee LEFT JOIN roles AS role ON role_id=role.id LEFT JOIN department on role.department_id=department.id LEFT JOIN employee AS manager ON employee.manager_id = manager.id')
    console.clear();
    console.table(results)
    promptUser();
  } catch (err) {
    console.error(err)
    promptUser()
  }
};


const addNewDepartment = async () => {
  console.clear();
  const questions = [
    {
      message: 'Enter the name of the new department:',
      type: 'input',
      name: 'newDepartmentName'
    }
  ]
  console.clear();
  try {
    const userInput = await inquirer.prompt(questions)
    const { newDepartmentName } = userInput
    await db.query('INSERT INTO department (names) VALUES (?)', newDepartmentName)

    console.clear();
    console.log('')
    console.log(`${newDepartmentName} has been added as a department.`)
    console.log('')

    promptUser();
  } catch (err) {
    console.error(err)
  }
};

const addNewRole = async () => {
  console.clear();
  const questions = [
    {
      message: 'Enter the title of the new role:',
      type: 'input',
      name: 'newTitleName'
    },
    {
      message: 'Enter the salary for the new role as an integer:',
      type: 'input',
      name: 'newRoleSalary'
    },
    {
      message: 'Select the department the new role will be apart of:',
      type: 'list',
      name: 'newRoleDepartment',
      choices: getListOfCurrentDepartments
    }
  ]
  try {
    const userInput = await inquirer.prompt(questions)
    const { newTitleName, newRoleSalary, newRoleDepartment } = userInput

    await db.query('INSERT INTO roles (title, salary, department_id) VALUES (?,?,?)',
      [newTitleName, newRoleSalary, await getDepartmentId(newRoleDepartment)])

    console.clear();
    console.log('')
    console.table(`${newTitleName} has been added as a role.`)
    console.log('')

    promptUser();
  } catch (err) {
    console.error(err)
    promptUser();
  }
};

const addNewEmployee = async () => {
  console.clear();
  const questions = [
    {
      message: "Enter the employees first name:",
      type: "input",
      name: "newEmployeeFirstName"
    },
    {
      message: "Enter the employees last name:",
      type: "input",
      name: "newEmployeeLastName"
    },
    {
      message: "Select the employees role:",
      type: "list",
      name: "newEmployeeRole",
      choices: getListOfCurrentRoles
    },
    {
      message: `Select the new employees manager`,
      type: "list",
      name: "newEmployeeManager",
      choices: getListOfCurrentManagers
    }
  ]

  try {
    const userInput = await inquirer.prompt(questions)
    const { newEmployeeFirstName, newEmployeeLastName, newEmployeeRole, newEmployeeManager } = userInput
    if (newEmployeeManager === 'No Manager') {
      await db.query('INSERT INTO employee (first_name, last_name, role_id) VALUES (?, ?, ?)',
        [newEmployeeFirstName, newEmployeeLastName, await getRoleId(newEmployeeRole)])
    } else {
      await db.query('INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)',
        [newEmployeeFirstName, newEmployeeLastName, await getRoleId(newEmployeeRole), await getEmployeeId(newEmployeeManager)])
    }

    console.clear();
    promptUser();
  } catch (err) {
    console.error(err)
    promptUser();
  }
};
const updateEmployeeRole = async () => {
  console.clear();
  const questions = [
    {
      message: 'Select the employee you would like to update:',
      type: 'list',
      name: 'employeeToUpdate',
      choices: getListOfCurrentEmployees
    },
    {
      message: 'Select the employees new role:',
      type: 'list',
      name: 'employeeNewRole',
      choices: getListOfCurrentRoles
    }
  ]
  try {
    const userInput = await inquirer.prompt(questions)
    const { employeeToUpdate, employeeNewRole } = userInput
    await db.query('UPDATE employee SET role_id=? WHERE id=?',
      [await getRoleId(employeeNewRole), await getEmployeeId(employeeToUpdate)])
    console.table(`Updated ${employeeToUpdate}'s role.`)
    promptUser();
  } catch (err) {
    console.error(err)
    promptUser();
  }
};

const getListOfCurrentDepartments = async () => {
  try {
    const [currentDepartments, info] = await db.query('SELECT * FROM department')
    const departmentNames = currentDepartments.map(name => name.names)
    return departmentNames;
  } catch (err) {
    console.error(err)
  }
};

const getListOfCurrentRoles = async () => {
  try {
    const [currentRoles, info] = await db.query('SELECT * FROM roles')
    const roleNames = currentRoles.map(name => name.title)
    return roleNames;
  } catch (err) {
    console.error(err)
  }
};

const getListOfCurrentManagers = async () => {
  try {
    const [currentManagers, info] = await db.query('SELECT first_name, last_name FROM employee WHERE manager_id IS NULL')
    const managerNames = currentManagers.map(name => `${name.first_name}`)
    managerNames.unshift('No Manager')
    return managerNames;
  } catch (err) {
    console.error(err)
  }
};

const getListOfCurrentEmployees = async () => {
  try {
    const [results, info] = await db.query('SELECT first_name, last_name FROM employee')
    const employeeNames = results.map(name => `${name.first_name}`)
    return employeeNames
  } catch (err) {
    console.error(err)
  }
};
 
const getDepartmentId = async (department) => {
  try {
    const [results, info] = await db.query('SELECT id FROM department WHERE names=?', department)
    const { id: departmentId } = results[0]
    return departmentId
  } catch (err) {
    console.error(err)
  }
};

const getRoleId = async (role) => {
  try {
    const [results, info] = await db.query('SELECT id FROM roles WHERE title=?', role)
    const { id: roleId } = results[0]
    return roleId;
  } catch (err) {
    console.error(err)
  }
};

const getEmployeeId = async (employee) => {
  try {
    const [results, info] = await db.query('SELECT id FROM employee WHERE first_name=?', employee)
    const { id } = results[0]
    return id;
  } catch (err) {
    console.error(err)
  }
};

promptUser();
