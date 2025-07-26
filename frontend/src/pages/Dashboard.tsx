import { useAuthStore } from "../store/authStore";

function Dashboard() {
  const getInitials = (username: string) => {
    return username
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  };
 const formatDate = (date: string) => {
  return new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

  const { user, logout } = useAuthStore();
  return (
    <div className="flex justify-center items-center h-[600px]">
      <div className="flex flex-col border border-[#262626] rounded-xl p-10   gap-3">
        <div className="w-20 h-20 flex text-4xl items-center justify-center rounded-full border  font-bold  ">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="avatar"
              className="w-full h-full rounded-full object-cover "
            />
          ) : (
            getInitials(user?.username || "")
          )}
        </div>

        <span className="text-[#666666]">
          Username: <span className="text-white"> {user?.username}</span>
        </span>
        <span className="text-[#666666]">
          Email: <span className="text-white"> {user?.email}</span>
        </span>
        <span className="text-[#666666]">
          Total Deployments:{" "}
          <span className="text-white"> {user?.deployments_count}</span>
        </span>
        <span className="text-[#666666]">
          Total Deployments:{" "}
          <span className="text-white"> {formatDate(user?.createdAt || "")}</span>
        </span>
        <span
          className="p-2 border-red-500 border w-[100px] text-center rounded-lg hover:bg-red-500 cursor-pointer text-sm transition duration-300 text-red-500 hover:text-white mt-4"
          onClick={() => logout()}
        >
          Logout
        </span>
      </div>
    </div>
  );
}

export default Dashboard;
