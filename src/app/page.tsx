import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold">300 Club Fantasy Baseball</h1>
      <nav className="mt-4">
        <ul className="space-y-2">
          <li>
            <Link href="/hitters" className="text-blue-600 hover:underline">
              View Hitters Leaderboard
            </Link>
          </li>
          {/* Add more links here for other categories */}
        </ul>
      </nav>
    </div>
  )
}