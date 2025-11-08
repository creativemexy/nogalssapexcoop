import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/api_service.dart';

class MemberDashboardScreen extends StatefulWidget {
  const MemberDashboardScreen({super.key});

  @override
  State<MemberDashboardScreen> createState() => _MemberDashboardScreenState();
}

class _MemberDashboardScreenState extends State<MemberDashboardScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  double _totalContributions = 0.0;
  double _availableLoanAmount = 0.0;
  List<dynamic> _contributions = [];
  Map<String, dynamic>? _virtualAccount;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Load contributions
      final contributionsData = await _apiService.getMemberContributions();
      if (contributionsData['contributions'] != null) {
        setState(() {
          _contributions = List<dynamic>.from(contributionsData['contributions']);
          _totalContributions = (contributionsData['stats']?['totalAmount'] ?? 0.0).toDouble();
        });
      }

      // Load virtual account
      try {
        final virtualAccountData = await _apiService.getMemberVirtualAccount();
        if (virtualAccountData['virtualAccount'] != null) {
          setState(() {
            _virtualAccount = virtualAccountData['virtualAccount'];
          });
        }
      } catch (e) {
        // Virtual account is optional
      }

      // Load loan eligibility
      try {
        final loanEligibilityData = await _apiService.getMemberLoanEligibility();
        if (loanEligibilityData['maxLoanAmount'] != null) {
          setState(() {
            _availableLoanAmount = (loanEligibilityData['maxLoanAmount'] ?? 0.0).toDouble();
          });
        } else {
          // Fallback: calculate based on contributions (6x)
          setState(() {
            _availableLoanAmount = _totalContributions * 6;
          });
        }
      } catch (e) {
        // Fallback calculation
        setState(() {
          _availableLoanAmount = _totalContributions * 6;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load data: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _makeContribution() async {
    final amountController = TextEditingController();
    final cooperativeId = context.read<AuthProvider>().user?.cooperativeId;

    if (cooperativeId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No cooperative associated with your account')),
      );
      return;
    }

    final result = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Make Contribution'),
        content: TextField(
          controller: amountController,
          keyboardType: TextInputType.number,
          decoration: const InputDecoration(
            labelText: 'Amount (₦)',
            hintText: 'Enter amount',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              final amount = double.tryParse(amountController.text);
              if (amount != null && amount > 0) {
                Navigator.pop(context, amount);
              }
            },
            child: const Text('Continue'),
          ),
        ],
      ),
    );

    if (result != null) {
      try {
        final response = await _apiService.makeContribution(
          amount: result,
          cooperativeId: cooperativeId,
        );

        if (response['success'] == true && response['paymentUrl'] != null) {
          final url = Uri.parse(response['paymentUrl']);
          if (await canLaunchUrl(url)) {
            await launchUrl(url, mode: LaunchMode.externalApplication);
            // Refresh data after payment
            Future.delayed(const Duration(seconds: 3), () {
              if (mounted) {
                _loadData();
              }
            });
          }
        } else {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(response['error'] ?? 'Failed to initialize payment')),
            );
          }
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error: ${e.toString()}')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Member Dashboard'),
        backgroundColor: const Color(0xFF16A34A),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (mounted) {
                context.go('/login');
              }
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(_error!),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadData,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Welcome message
                        Text(
                          'Welcome, ${user?.name ?? 'Member'}',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'This is your personal dashboard. View your contributions, apply for loans, and see your transaction history.',
                        ),
                        const SizedBox(height: 24),

                        // Virtual Account Card
                        if (_virtualAccount != null)
                          Card(
                            color: Colors.green[50],
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text(
                                    'Your Virtual Account',
                                    style: TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green,
                                    ),
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text('Bank Name'),
                                            Text(
                                              _virtualAccount!['bankName'] ?? '',
                                              style: const TextStyle(fontWeight: FontWeight.bold),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            const Text('Account Number'),
                                            Text(
                                              _virtualAccount!['accountNumber'] ?? '',
                                              style: const TextStyle(fontWeight: FontWeight.bold),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),

                        const SizedBox(height: 16),

                        // Stats Cards
                        Row(
                          children: [
                            Expanded(
                              child: Card(
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Total Contributions',
                                        style: TextStyle(color: Colors.grey),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        '₦${NumberFormat('#,##0.00').format(_totalContributions)}',
                                        style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.green,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Card(
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      const Text(
                                        'Available Loan',
                                        style: TextStyle(color: Colors.grey),
                                      ),
                                      const SizedBox(height: 8),
                                      Text(
                                        '₦${NumberFormat('#,##0.00').format(_availableLoanAmount)}',
                                        style: const TextStyle(
                                          fontSize: 20,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.blue,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),

                        // Quick Actions
                        const Text(
                          'Quick Actions',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: [
                            ElevatedButton.icon(
                              onPressed: _makeContribution,
                              icon: const Icon(Icons.add),
                              label: const Text('Make Contribution'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green,
                                foregroundColor: Colors.white,
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: () => context.push('/withdrawals'),
                              icon: const Icon(Icons.arrow_downward),
                              label: const Text('My Withdrawals'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.blue,
                                foregroundColor: Colors.white,
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: () => context.push('/loans'),
                              icon: const Icon(Icons.money),
                              label: const Text('My Loans'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.purple,
                                foregroundColor: Colors.white,
                              ),
                            ),
                            ElevatedButton.icon(
                              onPressed: () => context.push('/contributions'),
                              icon: const Icon(Icons.history),
                              label: const Text('View All Contributions'),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.orange,
                                foregroundColor: Colors.white,
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 24),

                        // Contribution History
                        const Text(
                          'Contribution History',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (_contributions.isEmpty)
                          const Card(
                            child: Padding(
                              padding: EdgeInsets.all(32),
                              child: Center(
                                child: Text('No contributions found'),
                              ),
                            ),
                          )
                        else
                          ..._contributions.take(3).map((contrib) {
                            return Card(
                              margin: const EdgeInsets.only(bottom: 8),
                              child: ListTile(
                                leading: const Icon(Icons.payment, color: Colors.green),
                                title: Text(
                                  '₦${NumberFormat('#,##0.00').format(contrib['amount'] ?? 0.0)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                subtitle: Text(
                                  contrib['cooperative']?['name'] ?? 'Cooperative',
                                ),
                                trailing: Text(
                                  DateFormat('MMM dd, yyyy').format(
                                    DateTime.parse(contrib['createdAt'] ?? DateTime.now().toIso8601String()),
                                  ),
                                  style: const TextStyle(fontSize: 12),
                                ),
                              ),
                            );
                          }),
                        if (_contributions.length > 3)
                          TextButton(
                            onPressed: () => context.push('/contributions'),
                            child: Text('View All Contributions (${_contributions.length} total)'),
                          ),
                      ],
                    ),
                  ),
                ),
    );
  }
}
