package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var searchCmd = &cobra.Command{
	Use:   "search [keyword]",
	Short: "Search for skills in the registry",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		keyword := args[0]
		// TODO: call API to search skills
		fmt.Printf("Searching for '%s'...\n", keyword)
		fmt.Println("Search not yet implemented")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(searchCmd)
}
