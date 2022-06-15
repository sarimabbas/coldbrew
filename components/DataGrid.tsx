import { AgGridReact } from "ag-grid-react";
import React, { useCallback } from "react";
import { ICask } from "../lib";

interface IDataGridProps {
  casks: ICask[];
  selectedCasks: ICask[];
}

const columns = [
  { field: "logo" },
  { field: "name" },
  { field: "cask" },
  { field: "homepage" },
];

const DataGrid = ({ casks, selectedCasks }: IDataGridProps) => {
  return (
    <div className="ag-theme-alpine w-full h-screen">
      <AgGridReact rowData={casks} columnDefs={columns}></AgGridReact>
    </div>
  );
};

export default DataGrid;
