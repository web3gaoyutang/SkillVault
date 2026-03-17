package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var (
	serverURL string
)

var rootCmd = &cobra.Command{
	Use:   "skillvault",
	Short: "SkillVault CLI - Private Skill Registry for AI agents",
	Long:  `SkillVault is a self-hostable private Skill Registry for AI coding agents. It provides upload, management, review, discovery, and installation of reusable skills.`,
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func init() {
	rootCmd.PersistentFlags().StringVar(&serverURL, "server", "", "SkillVault server URL (e.g. https://registry.example.com)")
}
