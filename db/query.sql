SELECT departments.name 
FROM roles
LEFT JOIN departments
ON roles.department_id = departments.id
ORDER BY departments.name;
