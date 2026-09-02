import Dashboard from "./components/Dashboard";
import UserContext from "./UserContext";

function App() {

  const user = {
    name: "Student",
    role: "User"
  };

  return (
    <UserContext.Provider value={user}>
      <Dashboard />
    </UserContext.Provider>
  );
}

export default App;