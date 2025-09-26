import React from "react";

const Program: React.FC = () => {
  return (
    <div className="main-content">
      <div className="search-container">
        <input type="text" placeholder="Search..." />
      </div>
      <button className="add-button">Add Program</button>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>College</th>
              <th>Name</th>
              <th>Code</th>
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

export default Program;

