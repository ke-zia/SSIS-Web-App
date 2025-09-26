import React from "react";

const College = () => {
  return (
    <div className="main-content">
      <div className="search-container">
        <input type="text" placeholder="Search..." />
      </div>
      <button className="add-button">Add College</button>
      <div className="table-container">
        <table>
          <thead>
            <tr>
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

export default College;
