import React from "react";

const Students: React.FC = () => {
  return (
    <div className="main-content">
      <div className="search-container">
        <input type="text" placeholder="Search..." />
      </div>
      <button className="add-button">Add Student</button>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Program</th>
              <th>Year</th>
              <th>Gender</th>
            </tr>
          </thead>
          <tbody>
            {/* Rows will go here */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Students;

