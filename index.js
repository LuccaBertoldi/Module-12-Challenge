const express = require('express');
// Import and require Pool (node-postgres)
// We'll be creating a Connection Pool. Read up on the benefits here: https://node-postgres.com/features/pooling
const { Pool } = require('pg');
const inquirer = require('inquirer');

const PORT = process.env.PORT || 3001;
const app = express();

// Express middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Connect to database
const pool = new Pool(
  {
    // Enter PostgreSQL username
    user: 'postgres',
    // Enter PostgreSQL password
    password: '001223',
    host: 'localhost',
    database: 'employee_db'
},
console.log('Connected to the employee_db database!')
)

pool.connect();


const mainMenu = () => {
    inquirer.prompt({
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'View All Departments',
        'View All Roles',
        'View All Employees',
        'Add Department',
        'Add Role',
        'Add Employee',
        'Update Employee Role',
        'Exit'
      ]
    }).then(answer => {
      switch (answer.action) {
        case 'View All Departments':
          viewAllDepartments();
          break;
        case 'View All Roles':
          viewAllRoles();
          break;
        case 'View All Employees':
          viewAllEmployees();
          break;
        case 'Add Department':
          addDepartment();
          break;
        case 'Add Role':
          addRole();
          break;
        case 'Add Employee':
          addEmployee();
          break;
        case 'Update Employee Role':
          updateEmployeeRole();
          break;
        case 'Exit':
          pool.end();
          break;
      }
    });
  };
  
  const viewAllDepartments = () => {
    pool.query('SELECT * FROM departments', (err, res) => {
      if (err) throw err;
      console.table(res.rows);
      mainMenu();
    });
  };

  const viewAllRoles = () => {
    pool.query(`
      SELECT roles.id, roles.title, departments.name AS department, roles.salary
      FROM roles
      JOIN departments ON roles.department_id = departments.id;
    `, (err, res) => {
      if (err) throw err;
      console.table(res.rows);
      mainMenu();
    });
  };
  
  const viewAllEmployees = () => {
    pool.query(`
      SELECT employees.id, employees.first_name, employees.last_name, roles.title, departments.name AS department, roles.salary, 
             (SELECT CONCAT(manager.first_name, ' ', manager.last_name) FROM employees manager WHERE manager.id = employees.manager_id) AS manager
      FROM employees
      JOIN roles ON employees.role_id = roles.id
      JOIN departments ON roles.department_id = departments.id;
    `, (err, res) => {
      if (err) throw err;
      console.table(res.rows);
      mainMenu();
    });
  };
  
  const addDepartment = () => {
    inquirer.prompt({
      type: 'input',
      name: 'name',
      message: 'Enter the name of the department:'
    }).then(answer => {
      pool.query('INSERT INTO departments (name) VALUES ($1)', [answer.name], (err, res) => {
        if (err) throw err;
        console.log('Department added successfully!');
        mainMenu();
      });
    });
  };
  
  const addRole = () => {
    pool.query('SELECT * FROM departments', (err, res) => {
      if (err) throw err;
      const departmentChoices = res.rows.map(department => ({ name: department.name, value: department.id }));
      
      inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter the name of the role:'
        },
        {
          type: 'input',
          name: 'salary',
          message: 'Enter the salary for this role:'
        },
        {
          type: 'list',
          name: 'department_id',
          message: 'Select the department for this role:',
          choices: departmentChoices
        }
      ]).then(answers => {
        pool.query('INSERT INTO roles (title, salary, department_id) VALUES ($1, $2, $3)', 
        [answers.title, answers.salary, answers.department_id], (err, res) => {
          if (err) throw err;
          console.log('Role added successfully!');
          mainMenu();
        });
      });
    });
  };
  
  const addEmployee = () => {
    pool.query('SELECT * FROM roles', (err, res) => {
      if (err) throw err;
      const roleChoices = res.rows.map(role => ({ name: role.title, value: role.id }));
  
      pool.query('SELECT * FROM employees', (err, res) => {
        if (err) throw err;
        const managerChoices = res.rows.map(manager => ({ name: `${manager.first_name} ${manager.last_name}`, value: manager.id }));
        managerChoices.push({ name: 'None', value: null });
  
        inquirer.prompt([
          {
            type: 'input',
            name: 'first_name',
            message: 'Enter the first name of the employee:'
          },
          {
            type: 'input',
            name: 'last_name',
            message: 'Enter the last name of the employee:'
          },
          {
            type: 'list',
            name: 'role_id',
            message: 'Select the role of the employee:',
            choices: roleChoices
          },
          {
            type: 'list',
            name: 'manager_id',
            message: 'Select the manager of the employee:',
            choices: managerChoices
          }
        ]).then(answers => {
          pool.query('INSERT INTO employees (first_name, last_name, role_id, manager_id) VALUES ($1, $2, $3, $4)', 
          [answers.first_name, answers.last_name, answers.role_id, answers.manager_id], (err, res) => {
            if (err) throw err;
            console.log('Employee added successfully!');
            mainMenu();
          });
        });
      });
    });
  };
  
  const updateEmployeeRole = () => {
    pool.query('SELECT * FROM employees', (err, res) => {
      if (err) throw err;
      const employeeChoices = res.rows.map(employee => ({ name: `${employee.first_name} ${employee.last_name}`, value: employee.id }));
  
      pool.query('SELECT * FROM roles', (err, res) => {
        if (err) throw err;
        const roleChoices = res.rows.map(role => ({ name: role.title, value: role.id }));
  
        inquirer.prompt([
          {
            type: 'list',
            name: 'employee_id',
            message: 'Select the employee to update:',
            choices: employeeChoices
          },
          {
            type: 'list',
            name: 'role_id',
            message: 'Select the new role:',
            choices: roleChoices
          }
        ]).then(answers => {
          pool.query('UPDATE employees SET role_id = $1 WHERE id = $2', 
          [answers.role_id, answers.employee_id], (err, res) => {
            if (err) throw err;
            console.log('Employee role updated successfully!');
            mainMenu();
          });
        });
      });
    });
  };
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
  
  mainMenu();