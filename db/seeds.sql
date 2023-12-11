INSERT INTO department (names) 
VALUES ('Sales'),
('Development'),
('Labor'),
('Finance');

INSERT INTO roles (title, salary, department_id) 
VALUES ('Sales Associate', 35000, 1),
('Client Account Manager', 60000, 1),
('Senior Developer', 120000, 2),
('Junior Developer', 90000, 2),
('Apprentice Lineman', 60000, 3),
('Lineman Foreman', 100000, 3),
('Account Finance', 100000, 4),
('Finance LEAD', 200000, 4);

INSERT INTO employee (first_name, last_name, role_id, manager_id)
VALUES ('Vin', 'Sierra', 1, NULL),
('Bo', 'Nix', 1, 1),
('Jake', 'Andreozzi', 2, NULL),
('Omar', 'Sabbagh', 2, 2),
('Anthony', 'Schiavo', 3, NULL),
('Kyle', 'Sastram', 3, 3),
('Olivia', 'Gill', 4, NULL),
('Tim', 'Burger', 4, 4);
