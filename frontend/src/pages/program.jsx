import React from "react";

const Program = () => {
  return (
    <div className="main-content">
      <div className="search-container">
        <input type="text" placeholder="Search..." />
        <select>
          <option value="college">College</option>
          <option value="name">Name</option>
          <option value="code">Code</option>
        </select>
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
