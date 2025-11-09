#!/usr/bin/env bash
################################################################################
# MicroK8s Observability Stack Setup Script
# 
# Purpose: Automated installation and configuration of MicroK8s with 
#          Prometheus, Grafana, and Loki for production-ready observability
#
# Usage:
#   Local:  bash setup-microk8s-observability.sh
#   Remote: ssh user@host 'bash -s' < setup-microk8s-observability.sh
#   Docker: COPY setup-microk8s-observability.sh /scripts/ && RUN /scripts/setup-microk8s-observability.sh
#
# Requirements: Ubuntu 20.04+, sudo access, internet connection
# Author: ShieldX Platform Team
# Version: 1.0.0
################################################################################

set -euo pipefail
IFS=$'\n\t'

# ============================================================================
# Configuration Variables
# ============================================================================
readonly SCRIPT_VERSION="1.0.0"
readonly MICROK8S_CHANNEL="${MICROK8S_CHANNEL:-1.28/stable}"
readonly NAMESPACE_OBSERVABILITY="observability"
readonly LOG_FILE="/var/log/microk8s-setup.log"
readonly KUBECONFIG_PATH="${HOME}/.kube/config"

# Color codes for beautiful terminal output
readonly COLOR_RESET="\033[0m"
readonly COLOR_RED="\033[0;31m"
readonly COLOR_GREEN="\033[0;32m"
readonly COLOR_YELLOW="\033[1;33m"
readonly COLOR_BLUE="\033[0;34m"
readonly COLOR_MAGENTA="\033[0;35m"
readonly COLOR_CYAN="\033[0;36m"
readonly COLOR_WHITE="\033[1;37m"

# Unicode symbols for professional output
readonly SYMBOL_CHECK="✓"
readonly SYMBOL_CROSS="✗"
readonly SYMBOL_ARROW="➜"
readonly SYMBOL_INFO="ℹ"
readonly SYMBOL_WARN="⚠"
readonly SYMBOL_ROCKET="🚀"
readonly SYMBOL_WRENCH="🔧"
readonly SYMBOL_CHART="📊"
readonly SYMBOL_LOCK="🔒"

# ============================================================================
# Logging Functions
# ============================================================================
log() {
    echo -e "${COLOR_WHITE}[$(date +'%Y-%m-%d %H:%M:%S')]${COLOR_RESET} $*" | tee -a "${LOG_FILE}"
}

log_info() {
    echo -e "${COLOR_CYAN}${SYMBOL_INFO}${COLOR_RESET} ${COLOR_WHITE}$*${COLOR_RESET}" | tee -a "${LOG_FILE}"
}

log_success() {
    echo -e "${COLOR_GREEN}${SYMBOL_CHECK}${COLOR_RESET} ${COLOR_GREEN}$*${COLOR_RESET}" | tee -a "${LOG_FILE}"
}

log_error() {
    echo -e "${COLOR_RED}${SYMBOL_CROSS}${COLOR_RESET} ${COLOR_RED}ERROR: $*${COLOR_RESET}" | tee -a "${LOG_FILE}" >&2
}

log_warn() {
    echo -e "${COLOR_YELLOW}${SYMBOL_WARN}${COLOR_RESET} ${COLOR_YELLOW}WARNING: $*${COLOR_RESET}" | tee -a "${LOG_FILE}"
}

log_step() {
    echo -e "\n${COLOR_MAGENTA}${SYMBOL_ARROW}${COLOR_RESET} ${COLOR_MAGENTA}$*${COLOR_RESET}" | tee -a "${LOG_FILE}"
}

log_header() {
    echo -e "\n${COLOR_CYAN}╔════════════════════════════════════════════════════════════════╗${COLOR_RESET}"
    echo -e "${COLOR_CYAN}║${COLOR_RESET} ${COLOR_WHITE}$*${COLOR_RESET}"
    echo -e "${COLOR_CYAN}╚════════════════════════════════════════════════════════════════╝${COLOR_RESET}\n"
}

# ============================================================================
# Utility Functions
# ============================================================================
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "This script should NOT be run as root. Please run as a regular user with sudo privileges."
        exit 1
    fi
}

check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        log_warn "This script requires sudo privileges. You may be prompted for your password."
        sudo -v
    fi
}

check_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot determine OS. /etc/os-release not found."
        exit 1
    fi
    
    source /etc/os-release
    if [[ "${ID}" != "ubuntu" ]]; then
        log_warn "This script is optimized for Ubuntu. Your OS: ${NAME}"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

check_internet() {
    log_info "Checking internet connectivity..."
    if ! ping -c 1 -W 2 8.8.8.8 &>/dev/null; then
        log_error "No internet connection detected. Please check your network."
        exit 1
    fi
    log_success "Internet connection verified"
}

cleanup_on_error() {
    log_error "Setup failed. Check ${LOG_FILE} for details."
    exit 1
}

# ============================================================================
# Installation Functions
# ============================================================================
install_dependencies() {
    log_step "Installing system dependencies..."
    
    sudo apt-get update -qq
    sudo apt-get install -y -qq \
        snapd \
        curl \
        wget \
        jq \
        ca-certificates \
        gnupg \
        lsb-release \
        net-tools \
        || { log_error "Failed to install dependencies"; return 1; }
    
    log_success "System dependencies installed"
}

install_microk8s() {
    log_step "Installing MicroK8s ${MICROK8S_CHANNEL}..."
    
    if snap list microk8s &>/dev/null; then
        log_info "MicroK8s already installed. Checking version..."
        local current_version
        current_version=$(snap list microk8s | awk 'NR==2 {print $2}')
        log_info "Current version: ${current_version}"
    else
        sudo snap install microk8s --classic --channel="${MICROK8S_CHANNEL}" \
            || { log_error "Failed to install MicroK8s"; return 1; }
        log_success "MicroK8s ${MICROK8S_CHANNEL} installed successfully"
    fi
}

configure_user_permissions() {
    log_step "Configuring user permissions..."
    
    # Add user to microk8s group
    sudo usermod -a -G microk8s "${USER}" \
        || { log_error "Failed to add user to microk8s group"; return 1; }
    
    # Set ownership of .kube directory
    sudo chown -f -R "${USER}":"${USER}" "${HOME}/.kube" 2>/dev/null || true
    
    log_success "User permissions configured"
    log_warn "You may need to re-login or run 'newgrp microk8s' for group changes to take effect"
}

wait_for_microk8s() {
    log_step "Waiting for MicroK8s to be ready..."
    
    local max_wait=180
    local elapsed=0
    local interval=5
    
    while [[ $elapsed -lt $max_wait ]]; do
        if sudo microk8s status --wait-ready --timeout 10 &>/dev/null; then
            log_success "MicroK8s is ready"
            return 0
        fi
        echo -n "."
        sleep $interval
        elapsed=$((elapsed + interval))
    done
    
    log_error "MicroK8s did not become ready within ${max_wait} seconds"
    return 1
}

enable_core_addons() {
    log_step "Enabling core MicroK8s addons..."
    
    local addons=("dns" "hostpath-storage" "rbac")
    
    for addon in "${addons[@]}"; do
        log_info "Enabling ${addon}..."
        if sudo microk8s enable "${addon}" 2>&1 | tee -a "${LOG_FILE}"; then
            log_success "${addon} enabled"
        else
            log_error "Failed to enable ${addon}"
            return 1
        fi
        sleep 5
    done
}

enable_observability_stack() {
    log_step "${SYMBOL_CHART} Enabling Observability Stack (Prometheus, Grafana, Loki)..."
    
    if sudo microk8s enable observability 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "Observability stack enabled successfully"
    else
        log_error "Failed to enable observability stack"
        return 1
    fi
    
    log_info "Waiting for observability components to start..."
    sleep 15
}

enable_ingress() {
    log_step "Enabling Ingress controller..."
    
    if sudo microk8s enable ingress 2>&1 | tee -a "${LOG_FILE}"; then
        log_success "Ingress controller enabled"
    else
        log_warn "Ingress controller failed to enable (optional component)"
    fi
}

setup_kubeconfig() {
    log_step "Setting up kubeconfig..."
    
    mkdir -p "${HOME}/.kube"
    sudo microk8s config > "${KUBECONFIG_PATH}" 2>/dev/null || {
        log_error "Failed to export kubeconfig"
        return 1
    }
    chmod 600 "${KUBECONFIG_PATH}"
    
    log_success "Kubeconfig exported to ${KUBECONFIG_PATH}"
}

create_namespace() {
    log_step "Creating ${NAMESPACE_OBSERVABILITY} namespace..."
    
    if sudo microk8s kubectl get namespace "${NAMESPACE_OBSERVABILITY}" &>/dev/null; then
        log_info "Namespace ${NAMESPACE_OBSERVABILITY} already exists"
    else
        sudo microk8s kubectl create namespace "${NAMESPACE_OBSERVABILITY}" \
            || { log_error "Failed to create namespace"; return 1; }
        log_success "Namespace ${NAMESPACE_OBSERVABILITY} created"
    fi
}

# ============================================================================
# Verification Functions
# ============================================================================
verify_installation() {
    log_header "Verifying Installation"
    
    log_info "Checking cluster status..."
    sudo microk8s kubectl get nodes || return 1
    
    log_info "Checking system pods..."
    sudo microk8s kubectl get pods -n kube-system || return 1
    
    log_info "Checking observability components..."
    sudo microk8s kubectl get pods -n observability || return 1
    
    log_success "All components verified successfully"
}

get_service_info() {
    log_header "Service Information"
    
    log_info "Fetching Grafana service details..."
    local grafana_service
    grafana_service=$(sudo microk8s kubectl get svc -n observability -l app.kubernetes.io/name=grafana -o json 2>/dev/null)
    
    if [[ -n "${grafana_service}" ]]; then
        local service_name
        service_name=$(echo "${grafana_service}" | jq -r '.items[0].metadata.name' 2>/dev/null)
        
        if [[ -n "${service_name}" && "${service_name}" != "null" ]]; then
            log_success "Grafana service found: ${service_name}"
            
            # Try to get admin password
            local admin_pass
            admin_pass=$(sudo microk8s kubectl get secret -n observability grafana -o jsonpath='{.data.admin-password}' 2>/dev/null | base64 -d 2>/dev/null || echo "N/A")
            
            echo -e "\n${COLOR_CYAN}╔════════════════════════════════════════════════════════════════╗${COLOR_RESET}"
            echo -e "${COLOR_CYAN}║${COLOR_RESET} ${COLOR_WHITE}Grafana Access Information${COLOR_RESET}"
            echo -e "${COLOR_CYAN}╠════════════════════════════════════════════════════════════════╣${COLOR_RESET}"
            echo -e "${COLOR_CYAN}║${COLOR_RESET} Service: ${COLOR_GREEN}${service_name}${COLOR_RESET}"
            echo -e "${COLOR_CYAN}║${COLOR_RESET} Username: ${COLOR_GREEN}admin${COLOR_RESET}"
            echo -e "${COLOR_CYAN}║${COLOR_RESET} Password: ${COLOR_GREEN}${admin_pass}${COLOR_RESET}"
            echo -e "${COLOR_CYAN}║${COLOR_RESET}"
            echo -e "${COLOR_CYAN}║${COLOR_RESET} ${COLOR_YELLOW}To access Grafana:${COLOR_RESET}"
            echo -e "${COLOR_CYAN}║${COLOR_RESET} microk8s kubectl -n observability port-forward svc/${service_name} 3000:80"
            echo -e "${COLOR_CYAN}║${COLOR_RESET} ${COLOR_BLUE}http://localhost:3000${COLOR_RESET}"
            echo -e "${COLOR_CYAN}╚════════════════════════════════════════════════════════════════╝${COLOR_RESET}\n"
        fi
    fi
    
    log_info "Prometheus and other services:"
    sudo microk8s kubectl get svc -n observability
}

create_kubectl_alias() {
    log_step "Creating kubectl alias..."
    
    local shell_rc="${HOME}/.bashrc"
    if [[ -n "${ZSH_VERSION:-}" ]]; then
        shell_rc="${HOME}/.zshrc"
    fi
    
    if ! grep -q "alias kubectl='microk8s kubectl'" "${shell_rc}" 2>/dev/null; then
        echo "" >> "${shell_rc}"
        echo "# MicroK8s kubectl alias" >> "${shell_rc}"
        echo "alias kubectl='microk8s kubectl'" >> "${shell_rc}"
        log_success "kubectl alias added to ${shell_rc}"
        log_warn "Run 'source ${shell_rc}' or restart your terminal to use the alias"
    else
        log_info "kubectl alias already exists"
    fi
}

# ============================================================================
# Main Installation Flow
# ============================================================================
main() {
    trap cleanup_on_error ERR
    
    # Initialize log file
    sudo mkdir -p "$(dirname "${LOG_FILE}")"
    sudo touch "${LOG_FILE}"
    sudo chown "${USER}":"${USER}" "${LOG_FILE}"
    
    log_header "${SYMBOL_ROCKET} MicroK8s Observability Stack Setup v${SCRIPT_VERSION}"
    
    # Pre-flight checks
    check_root
    check_sudo
    check_os
    check_internet
    
    # Installation steps
    install_dependencies
    install_microk8s
    configure_user_permissions
    
    # Apply group changes for current session
    if ! groups | grep -q microk8s; then
        log_info "Applying group changes..."
        exec sg microk8s "$0 --continue"
    fi
    
    wait_for_microk8s
    enable_core_addons
    enable_observability_stack
    enable_ingress
    setup_kubeconfig
    create_namespace
    
    # Verification and info
    sleep 10
    verify_installation
    get_service_info
    create_kubectl_alias
    
    # Final summary
    log_header "${SYMBOL_CHECK} Installation Complete!"
    
    echo -e "${COLOR_GREEN}${SYMBOL_ROCKET} MicroK8s with Observability Stack is ready!${COLOR_RESET}\n"
    echo -e "${COLOR_CYAN}Quick Start Commands:${COLOR_RESET}"
    echo -e "  ${COLOR_YELLOW}View all pods:${COLOR_RESET}"
    echo -e "    microk8s kubectl get pods -A\n"
    echo -e "  ${COLOR_YELLOW}Access Grafana:${COLOR_RESET}"
    echo -e "    microk8s kubectl -n observability port-forward svc/grafana 3000:80\n"
    echo -e "  ${COLOR_YELLOW}View logs:${COLOR_RESET}"
    echo -e "    tail -f ${LOG_FILE}\n"
    
    log_success "Setup completed successfully at $(date)"
}

# ============================================================================
# Script Entry Point
# ============================================================================
if [[ "$#" -gt 0 && "$1" == "--continue" ]]; then
    shift
fi

main "$@"
