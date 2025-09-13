import React, { useState, useEffect } from "react";
import axios from "axios";
import { Plus, ChevronDown, ChevronUp, Edit, Trash } from "lucide-react";

interface Building {
  id: string;
  building_id: number;
  zone_id: number;
  building_name: string;
  description: string;
  exhibits: string[]; // Exhibits as an array of strings
}

const BuildingsWidget: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [formData, setFormData] = useState<Building>({
    id: "",
    building_id: 0,
    zone_id: 0,
    building_name: "",
    description: "",
    exhibits: [], // Initialize exhibits as an empty array
  });

  const [newExhibit, setNewExhibit] = useState<string>(""); // input state for adding exhibits

  // Define buildings for each zone as string keys (matching zone_id)
  const [zoneBuildings, setZoneBuildings] = useState<{ [key: string]: { name: string, id: number }[] }>({
    "1": [  // Zone A
      { name: "Drawing Office 2", id: 22 },
      { name: "Department of Manufacturing and Industrial Engineering", id: 28 },
      { name: "Corridor", id: 23 },
    ],
    "2": [  // Zone B
      { name: "Drawing Office 1", id: 3 },
      { name: "Professor E.O.E. Pereira Theatre", id: 4 },
      { name: "Administrative Building", id: 5 },
      { name: "Security Unit", id: 6 },
      { name: "Department of Chemical and Process Engineering", id: 1 },
      { name: "Department Engineering Mathematics", id: 2 },
    ],
    "3": [  // Zone C
      { name: "Department of Electrical and Electronic Engineering", id: 8 },
      { name: "Department of Computer Engineering", id: 9 },
      { name: "Electrical and Electronic Workshop", id: 10 },
      { name: "Surveying Lab", id: 11 },
      { name: "Soil Lab", id: 12 },
      { name: "Materials Lab", id: 13 },
    ],
    "4": [  // Zone D
      { name: "Fluids Lab", id: 15 },
      { name: "New Mechanics Lab", id: 16 },
      { name: "Applied Mechanics Lab", id: 17 },
      { name: "Thermodynamics Lab", id: 18 },
      { name: "Generator Room", id: 19 },
      { name: "Engineering Workshop", id: 20 },
      { name: "Engineering Carpentry Shop", id: 21 },
    ],
  });

  // Get token from localStorage
  const token = localStorage.getItem("authToken");

  // Configure Axios instance with Authorization header
  const axiosInstance = axios.create({
    baseURL: "http://localhost:5000", // Your backend API base URL
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Fetch all buildings on component mount
  useEffect(() => {
    axiosInstance
      .get("/buildings")  // Fetch building data
      .then((res) => {
        const formatted = res.data.map((b: any) => ({
          ...b,
          id: b.building_id.toString(), // Use building_id as unique id
          exhibits: b.exhibits || [], // Ensure exhibits is always an array
        }));
        setBuildings(formatted);
      })
      .catch((err) => {
        console.error("Error fetching buildings:", err);
        if (err.response?.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = "/login";
        }
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.building_name || formData.zone_id < 1 || formData.building_id < 1) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      if (formData.id) {
        // Update existing building
        const res = await axiosInstance.put(
          `/buildings/${formData.building_id}`,
          {
            zone_id: formData.zone_id,
            building_name: formData.building_name,
            description: formData.description,
            exhibits: formData.exhibits, // Include exhibits in the update
          }
        );

        // Update the buildings list in the UI
        setBuildings((prev) =>
          prev.map((b) => (b.id === formData.id ? { ...b, ...formData } : b))
        );

        alert("Building updated successfully");
      } else {
        // Create new building
        const res = await axiosInstance.post("/buildings", {
          zone_id: formData.zone_id,
          building_name: formData.building_name,
          description: formData.description,
          exhibits: formData.exhibits, // Send exhibits when creating a new building
        });

        if (res.status === 201) {
          const newBuilding = {
            ...formData,
            id: Date.now().toString(),  // Generate temporary ID
            building_id: res.data.building.building_id, // Get real building_id from response
          };
          setBuildings((prev) => [...prev, newBuilding]);

          alert("Building added successfully");
        }
      }
    } catch (err: any) {
      console.error("Error saving building:", err);

      if (err.response?.status === 409) {
        alert("Building already added. Please use a unique name.");
      } else if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert("An unexpected error occurred while saving the building.");
      }
    }

    // Reset form after submission
    setFormData({
      id: "",
      building_id: 0,
      zone_id: 0,
      building_name: "",
      description: "",
      exhibits: [], // Reset exhibits
    });
    setShowForm(false);
    setNewExhibit("");
  };

  const handleEdit = (building: Building) => {
    setFormData(building);
    setNewExhibit("");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const building = buildings.find((b) => b.id === id);
    if (!building) return;

    try {
      await axiosInstance.delete(`/buildings/${building.building_id}`);
      // Remove deleted building from state
      setBuildings((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error("Error deleting building:", err);
    }
  };

  // Handle zone change and update the available building names
  const handleZoneChange = (zoneId: number) => {
    setFormData({
      ...formData,
      zone_id: zoneId,
      building_name: "", // Reset building name when zone changes
    });
  };

  // Add exhibit with + button
  const addExhibit = () => {
    if (newExhibit.trim()) {
      setFormData((prev) => ({
        ...prev,
        exhibits: [...prev.exhibits, newExhibit.trim()],
      }));
      setNewExhibit("");
    }
  };

  const removeExhibit = (exhibit: string) => {
    setFormData((prev) => ({
      ...prev,
      exhibits: prev.exhibits.filter((e) => e !== exhibit),
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={16} /> Add Building
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">
              {formData.id ? "Edit Building" : "Add Building"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-medium mb-1">Zone ID</label>
                <select
                  value={formData.zone_id}
                  onChange={(e) => handleZoneChange(Number(e.target.value))}
                  className="w-full border p-2 rounded"
                >
                  <option value={0}>Select Zone</option>
                  <option value={1}>A</option>
                  <option value={2}>B</option>
                  <option value={3}>C</option>
                  <option value={4}>D</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Building Name</label>
                <select
                  value={formData.building_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      building_name: e.target.value,
                      building_id: zoneBuildings[String(formData.zone_id)]
                        .find((b) => b.name === e.target.value)?.id || 0,
                    })
                  }
                  className="w-full border p-2 rounded"
                  disabled={!formData.zone_id}
                >
                  <option value="">Select Building</option>
                  {(zoneBuildings[String(formData.zone_id)] || []).map((building) => (
                    <option key={building.id} value={building.name}>
                      {building.name} (ID: {building.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  className="w-full border p-2 rounded"
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div>
                <label className="block font-medium mb-1">Exhibits</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add Exhibit"
                    value={newExhibit}
                    onChange={(e) => setNewExhibit(e.target.value)}
                    className="flex-1 border p-2 rounded"
                  />
                  <button
                    type="button"
                    onClick={addExhibit}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  {formData.exhibits.map((exhibit, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                      <span>{exhibit}</span>
                      <button
                        type="button"
                        onClick={() => removeExhibit(exhibit)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Buildings List */}
      <div className="space-y-3">
        {buildings.map((b) => (
          <div key={b.id} className="border rounded-lg bg-white shadow-sm">
            <button
              onClick={() => setExpanded(expanded === b.id ? null : b.id)}
              className="w-full flex justify-between items-center px-4 py-3 text-left font-medium hover:bg-gray-50"
            >
              {b.building_name}
              {expanded === b.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {expanded === b.id && (
              <div className="px-4 pb-4 space-y-2">
                <p>
                  <span className="font-semibold">Building ID:</span> {b.building_id}
                </p>
                <p>
                  <span className="font-semibold">Zone ID:</span> {b.zone_id}
                </p>
                <p>
                  <span className="font-semibold">Description:</span> {b.description}
                </p>
                <p>
                  <span className="font-semibold">Exhibits:</span>{" "}
                  {b.exhibits.length > 0 ? b.exhibits.join(", ") : "No exhibits available"}
                </p>

                <div className="flex gap-3 mt-2">
                  <button
                    onClick={() => handleEdit(b)}
                    className="px-3 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    <Edit size={14} className="inline-block mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <Trash size={14} className="inline-block mr-1" /> Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BuildingsWidget;
