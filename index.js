const mysql = require("mysql2");
const inquirer = require("inquirer");

const db = mysql
  .createConnection({
    host: "localhost",
    user: "root",
    password: "myRoot",
    database: "company_db",
  })
  .promise();

const dbPrompt = [
  {
    name: "selectedFunction",
    message: "Choose a database function:",
    type: "list",
    choices: [
      "View all departments",
      "View all roles",
      "View all employees",
      "Add a department",
      "Add a role",
      "Add an employee",
      "Update an employee role",
      "Update employee managers",
      "View employees by manager",
      "View employees by department",
      "Delete departments, roles, and employees",
      "View total utilized budget of a department",
      "Exit",
    ],
  },
];

const promptUser = async () => {
  try {
    const data = await inquirer.prompt(dbPrompt);
    const { selectedFunction } = data;
    processUserInput(selectedFunction);
  } catch (err) {
    console.error(err);
  }
};

const processUserInput = (userChoice) => {
  switch (userChoice) {
    case "View all departments":
      showDepartments();
      break;
    case "View all roles":
      showAllRoles();
      break;
    case "View all employees":
      showEmployees();
      break;
    case "Add a department":
      createNewDepartment();
      break;
    case "Add a role":
      createNewRole();
      break;
    case "Add an employee":
      createNewEmployee();
      break;
    case "Update an employee role":
      updateEmployeeRole();
      break;
    case "Update employee managers":
      updateEmployeeManager();
      break;
    case "View employees by manager":
      showEmployeesByManager();
      break;
    case "View employees by department":
      showEmployeesByDepartment();
      break;
    case "Delete departments, roles, and employees":
      deleteData();
      break;
    case "View total utilized budget of a department":
      viewUtilizedBudget();
      break;
    case "Exit":
      console.clear();
      process.exit();
  }
};

const showDepartments = async () => {
  console.clear();
  try {
    const [results, info] = await db.query(
      "SELECT id, names AS Department FROM department"
    );
    console.clear();
    console.table(results);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const showAllRoles = async () => {
  try {
    const query = `
      SELECT role.id, 
      title AS Title, 
      salary, 
      department.names 
      AS Department
      FROM roles 
      AS role
      INNER JOIN department ON role.department_id = department.id
    `;

    const [results, info] = await db.query(query);

    console.clear();
    console.table(results);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const showEmployees = async () => {
  console.clear();
  try {
    const [results, info] = await db.query(`
      SELECT 
        employee.id,
        employee.first_name,
        employee.last_name,
        role.title AS Title,
        department.names AS Department,
        role.salary,
        manager.first_name AS Manager
      FROM 
        employee
      LEFT JOIN 
        roles AS role ON employee.role_id = role.id
      LEFT JOIN 
        department ON role.department_id = department.id
      LEFT JOIN 
        employee AS manager ON employee.manager_id = manager.id
    `);

    console.table(results);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const createNewDepartment = async () => {
  console.clear();
  const questions = [
    {
      message: "Enter the name of the new department:",
      type: "input",
      name: "newDepartmentName",
    },
  ];
  console.clear();
  try {
    const userInput = await inquirer.prompt(questions);
    const { newDepartmentName } = userInput;
    await db.query(
      "INSERT INTO department (names) VALUES (?)",
      newDepartmentName
    );
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const createNewRole = async () => {
  console.clear();
  const questions = [
    {
      message: "Enter the title of role:",
      type: "input",
      name: "newTitleName",
    },
    {
      message: "Enter the salary for the new role as an integer:",
      type: "input",
      name: "newRoleSalary",
    },
    {
      message: "Select the department the new role will be apart of:",
      type: "list",
      name: "newRoleDepartment",
      choices: listDepartments,
    },
  ];
  try {
    const userInput = await inquirer.prompt(questions);
    const { newTitleName, newRoleSalary, newRoleDepartment } = userInput;

    await db.query(
      "INSERT INTO roles (title, salary, department_id) VALUES (?,?,?)",
      [newTitleName, newRoleSalary, await getDepartmentId(newRoleDepartment)]
    );

    console.clear();
    console.log("");
    console.table(`${newTitleName} has been added as a role.`);
    console.log("");

    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const createNewEmployee = async () => {
  console.clear();
  const questions = [
    {
      message: "Enter the employees first name:",
      type: "input",
      name: "newEmployeeFirstName",
    },
    {
      message: "Enter the employees last name:",
      type: "input",
      name: "newEmployeeLastName",
    },
    {
      message: "Select the employees role:",
      type: "list",
      name: "newEmployeeRole",
      choices: getListOfCurrentRoles,
    },
    {
      message: `Select the new employees manager`,
      type: "list",
      name: "newEmployeeManager",
      choices: getListOfCurrentManagers,
    },
  ];

  try {
    const userInput = await inquirer.prompt(questions);
    const {
      newEmployeeFirstName,
      newEmployeeLastName,
      newEmployeeRole,
      newEmployeeManager,
    } = userInput;
    if (newEmployeeManager === "No Manager") {
      await db.query(
        "INSERT INTO employee (first_name, last_name, role_id) VALUES (?, ?, ?)",
        [
          newEmployeeFirstName,
          newEmployeeLastName,
          await getRoleId(newEmployeeRole),
        ]
      );
    } else {
      await db.query(
        "INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)",
        [
          newEmployeeFirstName,
          newEmployeeLastName,
          await getRoleId(newEmployeeRole),
          await getEmployeeId(newEmployeeManager),
        ]
      );
    }

    console.clear();
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const updateEmployeeRole = async () => {
  console.clear();
  const questions = [
    {
      message: "Select the employee you would like to update:",
      type: "list",
      name: "employeeToUpdate",
      choices: getListOfCurrentEmployees,
    },
    {
      message: "Select the employees new role:",
      type: "list",
      name: "employeeNewRole",
      choices: getListOfCurrentRoles,
    },
  ];
  try {
    const userInput = await inquirer.prompt(questions);
    const { employeeToUpdate, employeeNewRole } = userInput;
    await db.query("UPDATE employee SET role_id=? WHERE id=?", [
      await getRoleId(employeeNewRole),
      await getEmployeeId(employeeToUpdate),
    ]);
    console.table(`Updated ${employeeToUpdate}'s role.`);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const listDepartments = async () => {
  try {
    const [currentDepartments, info] = await db.query(
      "SELECT * FROM department"
    );
    const departmentNames = currentDepartments.map((name) => name.names);
    return departmentNames;
  } catch (err) {
    console.error(err);
  }
};

const getListOfCurrentRoles = async () => {
  try {
    const [currentRoles, info] = await db.query("SELECT * FROM roles");
    const roleNames = currentRoles.map((name) => name.title);
    return roleNames;
  } catch (err) {
    console.error(err);
  }
};

const getListOfCurrentManagers = async () => {
  try {
    const [currentManagers, info] = await db.query(
      "SELECT first_name, last_name FROM employee WHERE manager_id IS NULL"
    );
    const managerNames = currentManagers.map(
      (name) => `${name.first_name} ${name.last_name}`
    );
    managerNames.unshift("No Manager");
    return managerNames;
  } catch (err) {
    console.error(err);
  }
};

const getListOfCurrentEmployees = async () => {
  try {
    const [results, info] = await db.query(
      "SELECT first_name, last_name FROM employee"
    );
    const employeeNames = results.map(
      (name) => `${name.first_name} ${name.last_name}`
    );
    return employeeNames;
  } catch (err) {
    console.error(err);
  }
};

const getDepartmentId = async (department) => {
  try {
    const [results, info] = await db.query(
      "SELECT id FROM department WHERE names=?",
      department
    );
    const { id: departmentId } = results[0];
    return departmentId;
  } catch (err) {
    console.error(err);
  }
};

const getRoleId = async (role) => {
  try {
    const [results, info] = await db.query(
      "SELECT id FROM roles WHERE title=?",
      role
    );
    const { id: roleId } = results[0];
    return roleId;
  } catch (err) {
    console.error(err);
  }
};

const getEmployeeId = async (employee) => {
  try {
    const [results, info] = await db.query(
      "SELECT id FROM employee WHERE first_name=?",
      employee
    );
    const { id } = results;

    return id;
  } catch (err) {
    console.error(err);
  }
};

const updateEmployeeManager = async () => {
  console.clear();
  const questions = [
    {
      message: "Select the employee whose manager you would like to update:",
      type: "list",
      name: "employeeToUpdateManager",
      choices: getListOfCurrentEmployees,
    },
    {
      message: "Select the new manager for the employee:",
      type: "list",
      name: "newEmployeeManager",
      choices: getListOfCurrentManagers,
    },
  ];

  try {
    const userInput = await inquirer.prompt(questions);
    const { employeeToUpdateManager, newEmployeeManager } = userInput;
    await db.query("UPDATE employee SET manager_id = ? WHERE id = ?", [
      await getEmployeeId(newEmployeeManager),
      await getEmployeeId(employeeToUpdateManager),
    ]);
    console.table(`Updated ${employeeToUpdateManager}'s manager.`);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const viewEmployeesByManager = async () => {
  console.clear();
  const questions = [
    {
      message: "Select the manager to view their direct reports:",
      type: "list",
      name: "selectedManager",
      choices: getListOfCurrentManagers,
    },
  ];

  try {
    const userInput = await inquirer.prompt(questions);
    const { selectedManager } = userInput;
    const [results, info] = await db.query(
      "SELECT first_name, last_name FROM employee WHERE manager_id = ?",
      [await getEmployeeId(selectedManager)]
    );
    console.clear();
    console.table(results);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const viewEmployeesByDepartment = async () => {
  console.clear();
  const questions = [
    {
      message: "Select the department to view employees:",
      type: "list",
      name: "selectedDepartment",
      choices: listDepartments,
    },
  ];

  try {
    const userInput = await inquirer.prompt(questions);
    const { selectedDepartment } = userInput;
    const [results, info] = await db.query(
      "SELECT first_name, last_name FROM employee WHERE role_id IN (SELECT id FROM roles WHERE department_id = ?)",
      [await getDepartmentId(selectedDepartment)]
    );
    console.clear();
    console.table(results);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const deleteData = async () => {
  console.clear();
  const deletePrompt = [
    {
      name: "deleteOption",
      message: "Choose data to delete:",
      type: "list",
      choices: ["Delete department", "Delete role", "Delete employee"],
    },
  ];

  try {
    const deleteData = await inquirer.prompt(deletePrompt);
    const { deleteOption } = deleteData;

    switch (deleteOption) {
      case "Delete department":
        await deleteDepartment();
        break;
      case "Delete role":
        await deleteRole();
        break;
      case "Delete employee":
        await deleteEmployee();
        break;
    }
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const deleteDepartment = async () => {
  console.clear();
  const questions = [
    {
      message: "Select the department to delete:",
      type: "list",
      name: "departmentToDelete",
      choices: listDepartments,
    },
  ];

  try {
    const userInput = await inquirer.prompt(questions);
    const { departmentToDelete } = userInput;
    await db.query("DELETE FROM department WHERE names = ?", [
      departmentToDelete,
    ]);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const deleteRole = async () => {
  console.clear();
  const questions = [
    {
      message: "Select the role to delete:",
      type: "list",
      name: "roleToDelete",
      choices: getListOfCurrentRoles,
    },
  ];

  try {
    const userInput = await inquirer.prompt(questions);
    const { roleToDelete } = userInput;
    await db.query("DELETE FROM roles WHERE title = ?", [roleToDelete]);
    console.log(`${roleToDelete} has been deleted.`);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const deleteEmployee = async () => {
  console.clear();
  const questions = [
    {
      message: "Select the employee to delete:",
      type: "list",
      name: "employeeToDelete",
      choices: getListOfCurrentEmployees,
    },
  ];

  try {
    const userInput = await inquirer.prompt(questions);
    const { employeeToDelete } = userInput;
    await db.query("DELETE FROM employee WHERE first_name = ?", [
      employeeToDelete,
    ]);
    console.log(`${employeeToDelete} has been deleted.`);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

const viewUtilizedBudget = async () => {
  console.clear();
  const questions = [
    {
      message: "Select the department to view the total utilized budget:",
      type: "list",
      name: "selectedDepartmentBudget",
      choices: listDepartments,
    },
  ];

  try {
    const userInput = await inquirer.prompt(questions);
    const { selectedDepartmentBudget } = userInput;
    const [results, info] = await db.query(
      "SELECT SUM(salary) AS totalBudget FROM roles WHERE department_id = ?",
      [await getDepartmentId(selectedDepartmentBudget)]
    );
    console.clear();
    console.table(results);
    promptUser();
  } catch (err) {
    console.error(err);
    promptUser();
  }
};

promptUser();
