import { Component } from "react"
import NotFound from "../pages/NotFound"

// Catches render-time crashes anywhere below it in the tree and shows the
// same maintenance visual as NotFound instead of a blank white screen.
// React error boundaries must be class components — there's no hook
// equivalent for componentDidCatch.
export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info)
  }

  render() {
    if (this.state.hasError) {
      return <NotFound maintenance />
    }
    return this.props.children
  }
}
