import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/services/api_service.dart';

class ContributionsScreen extends StatefulWidget {
  const ContributionsScreen({super.key});

  @override
  State<ContributionsScreen> createState() => _ContributionsScreenState();
}

class _ContributionsScreenState extends State<ContributionsScreen> {
  final ApiService _apiService = ApiService();
  bool _isLoading = true;
  List<dynamic> _contributions = [];
  Map<String, dynamic>? _stats;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadContributions();
  }

  Future<void> _loadContributions() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await _apiService.getMemberContributions();
      setState(() {
        _contributions = List<dynamic>.from(data['contributions'] ?? []);
        _stats = data['stats'];
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load contributions: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Contributions'),
        backgroundColor: const Color(0xFF16A34A),
        foregroundColor: Colors.white,
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
                        onPressed: _loadContributions,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadContributions,
                  child: Column(
                    children: [
                      // Stats Card
                      if (_stats != null)
                        Card(
                          margin: const EdgeInsets.all(16),
                          color: Colors.green[50],
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                Column(
                                  children: [
                                    const Text('Total Amount'),
                                    Text(
                                      '₦${NumberFormat('#,##0.00').format((_stats!['totalAmount'] ?? 0.0).toDouble())}',
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                                Column(
                                  children: [
                                    const Text('Total Contributions'),
                                    Text(
                                      '${_stats!['totalContributions'] ?? 0}',
                                      style: const TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Contributions List
                      Expanded(
                        child: _contributions.isEmpty
                            ? const Center(
                                child: Text('No contributions found'),
                              )
                            : ListView.builder(
                                itemCount: _contributions.length,
                                itemBuilder: (context, index) {
                                  final contrib = _contributions[index];
                                  return Card(
                                    margin: const EdgeInsets.symmetric(
                                      horizontal: 16,
                                      vertical: 8,
                                    ),
                                    child: ListTile(
                                      leading: const Icon(
                                        Icons.payment,
                                        color: Colors.green,
                                      ),
                                      title: Text(
                                        '₦${NumberFormat('#,##0.00').format((contrib['amount'] ?? 0.0).toDouble())}',
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                      subtitle: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            contrib['cooperative']?['name'] ?? 'Cooperative',
                                          ),
                                          Text(
                                            DateFormat('MMM dd, yyyy HH:mm').format(
                                              DateTime.parse(
                                                contrib['createdAt'] ?? DateTime.now().toIso8601String(),
                                              ),
                                            ),
                                            style: const TextStyle(fontSize: 12),
                                          ),
                                        ],
                                      ),
                                      trailing: const Icon(Icons.chevron_right),
                                    ),
                                  );
                                },
                              ),
                      ),
                    ],
                  ),
                ),
    );
  }
}
