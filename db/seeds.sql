INSERT INTO department (names) 
VALUES ('Engineering'),
('Finance'),
('Legal'),
('Sales');

INSERT INTO roles (title, salary, department_id) 
VALUES ('Sales Assiciate', 35000, 1),
('Client Service Manager', 70000, 1),
('Senior Developer', 120000, 2),
('Junior Developer', 90000, 2),
('Accountant', 115000, 3),
('Office Manager', 100000, 3),
('Vice President',200000, 4),
('CEO', 300000, 4);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
 VALUES ('Vin', 'Sierra', 1, NULL),
('Bo', 'Nix', 2, 1),
('Jake', 'Andreozzi', 3, NULL),
('Omar', 'Sabbagh', 4, 3),
('Anthony', 'Schiavo', 5, NULL),
('Kyle', 'Sastram', 6, 5),
('Olivia', 'Gill', 7, NULL),
('Tim', 'Burger', 8, 7);